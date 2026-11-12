"use strict";

// Run only on an ephemeral Windows CI host. Installs and updates a temporary
// NSIS copy; neither this fixture version nor its local feed is published.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { execFileSync } = require("node:child_process");
const { _electron } = require("playwright");
const yaml = require("js-yaml");
const root = path.join(process.env.RUNNER_TEMP || require("node:os").tmpdir(), "bloodrun-update-check");
const installDir = path.join(root, "installed");
const release = path.resolve("release/windows-verification");
const version = require("../package.json").version;
const installer = path.join(release, `BLOODRUN DEMO Setup ${version}.exe`);
const executablePath = path.join(installDir, "BLOODRUN DEMO.exe");
const packageFile = path.join(installDir, "resources/app/package.json");
const profile = path.join(root, "profile");
const manifest = yaml.load(fs.readFileSync(path.join(release, "demo.yml"), "utf8"));
let offline = true;
let app;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const server = http.createServer((request, response) => {
  const name = decodeURIComponent(new URL(request.url, "http://localhost").pathname.slice(1));
  if (offline) { response.writeHead(503); response.end("unavailable feed test"); return; }
  const file = name === "demo.yml" ? path.join(release, "demo.yml")
    : name === manifest.files[0].url ? installer : null;
  if (!file) { response.writeHead(404); response.end(); return; }
  response.writeHead(200, { "Content-Length": fs.statSync(file).size });
  fs.createReadStream(file).pipe(response);
});

async function launch(response) {
  app = await _electron.launch({ executablePath, args: ["--user-data-dir=" + profile],
    env: { ...process.env, BR_DISABLE_GPU: "1" }, timeout: 90000 });
  const page = await app.firstWindow();
  await page.getByRole("button", { name: "ACCEPT", exact: true }).waitFor({ timeout: 30000 });
  const current = await app.evaluate(({ app, dialog }, data) => {
    const updater = process.mainModule.require(app.getAppPath() + "/node_modules/electron-updater").autoUpdater;
    Object.defineProperty(updater.app, "baseCachePath", { get: () => data.cache });
    updater.setFeedURL({ provider: "generic", url: data.url, channel: "demo" });
    updater.allowDowngrade = false;
    updater.disableDifferentialDownload = true;
    updater.autoInstallOnAppQuit = false;
    global.releaseProbe = { prompts: [], errors: [], downloaded: false };
    dialog.showMessageBox = async options => {
      global.releaseProbe.prompts.push({ buttons: options.buttons, response: data.response });
      return { response: data.response };
    };
    updater.on("error", error => global.releaseProbe.errors.push(error.message));
    updater.on("update-downloaded", () => { global.releaseProbe.downloaded = true; });
    global.releaseUpdater = updater;
    return app.getVersion();
  }, { response, cache: path.join(root, "cache"), url: `http://127.0.0.1:${server.address().port}/` });
  return { page, current };
}
async function check() {
  return app.evaluate(async () => {
    try {
      const result = await global.releaseUpdater.checkForUpdates();
      if (result?.downloadPromise) await result.downloadPromise;
      return { ok: true, ...global.releaseProbe };
    } catch (error) { return { ok: false, error: error.message, ...global.releaseProbe }; }
  });
}
async function stop() {
  const closed = app.waitForEvent("close", { timeout: 30000 });
  await app.evaluate(({ app }) => app.quit());
  await closed;
  app = null;
}
async function waitForVersion(expected) {
  for (let i = 0; i < 120; i++) {
    try { if (JSON.parse(fs.readFileSync(packageFile)).version === expected) return; } catch {}
    await delay(1000);
  }
  throw Error("Installed version did not become " + expected);
}
(async () => {
  assert.equal(process.platform, "win32");
  fs.mkdirSync(root, { recursive: true });
  execFileSync(installer, ["/S", "/D=" + installDir], { timeout: 120000 });
  await waitForVersion(version);
  console.log("PASS: Windows NSIS installed the candidate");
  // A lower-version fixture of the current updater exercises an actual NSIS
  // replacement. This is not the historical updater-free 1.0.1 download.
  const pkg = JSON.parse(fs.readFileSync(packageFile));
  pkg.version = "1.0.1-demo";
  fs.writeFileSync(packageFile, JSON.stringify(pkg, null, 2));
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const first = await launch(0);
  assert.equal(first.current, "1.0.1-demo");
  await first.page.evaluate(() => localStorage.setItem("wr_holmn_arcade_notice_found_v1", "1"));
  assert.equal((await check()).ok, false);
  await first.page.getByRole("button", { name: "ACCEPT", exact: true }).waitFor();
  console.log("PASS: unavailable feed leaves the Windows app responsive");
  offline = false;
  const downloaded = await check();
  assert.equal(downloaded.ok, true);
  assert.equal(downloaded.downloaded, true);
  assert.equal(downloaded.prompts[0].response, 0);
  assert.equal(await app.evaluate(({ app }) => app.getVersion()), "1.0.1-demo");
  console.log("PASS: download and Later leave the lower version running");
  await stop();
  await delay(1500);
  assert.equal(JSON.parse(fs.readFileSync(packageFile)).version, "1.0.1-demo");
  console.log("PASS: normal quit does not install without consent");
  await launch(1);
  const closed = app.waitForEvent("close", { timeout: 120000 });
  check().catch(() => {});
  await closed;
  app = null;
  await waitForVersion(version);
  console.log("PASS: explicit restart installs the NSIS update");
  const updated = await launch(0);
  assert.equal(updated.current, version);
  assert.equal(await updated.page.evaluate(() => localStorage.getItem("wr_holmn_arcade_notice_found_v1")), "1");
  console.log("PASS: updated Windows app starts and preserves local state");
  await stop();
})().catch(async error => {
  console.error(error);
  process.exitCode = 1;
  if (app) { try { await app.evaluate(({ app }) => app.exit(1)); } catch {} }
}).finally(() => server.close());
