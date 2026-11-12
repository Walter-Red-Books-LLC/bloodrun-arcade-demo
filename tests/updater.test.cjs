const test = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const { startUpdater } = require("../updater.cjs");

function setup(overrides = {}) {
  const app = new EventEmitter(); app.isPackaged = true;
  const updater = new EventEmitter();
  const { AppUpdater } = require("electron-updater/out/AppUpdater");
  Object.defineProperty(updater, "channel", Object.getOwnPropertyDescriptor(AppUpdater.prototype, "channel"));
  let checks = 0, installs = 0;
  updater.checkForUpdates = async () => { checks++; };
  updater.quitAndInstall = () => { installs++; };
  const timers = [];
  const options = { app, autoUpdater: updater, platform: "darwin", portable: false,
    dialog: { showMessageBox: async () => ({ response: 0 }) },
    schedule: (fn, ms) => { timers.push({ fn, ms }); return { unref() {} }; },
    repeat: () => ({ unref() {} }), logger: { warn() {} }, ...overrides };
  return { options, updater, timers, counts: () => ({ checks, installs }) };
}
test("development and Windows portable copies never start network checks", () => {
  for (const override of [{ app: { isPackaged: false } }, { platform: "win32", portable: true }, { platform: "linux" }]) {
    const s = setup(override);
    assert.equal(startUpdater(s.options), null);
    assert.equal(s.timers.length, 0);
  }
});
test("packaged app checks automatically on demo channel and isolates offline errors", async () => {
  const s = setup(); const controller = startUpdater(s.options);
  assert.equal(s.timers[0].ms, 15000);
  assert.equal(s.updater.channel, "demo");
  assert.equal(s.updater.allowDowngrade, false);
  assert.equal(s.updater.autoInstallOnAppQuit, false);
  await s.timers[0].fn();
  assert.equal(s.counts().checks, 1);
  s.updater.checkForUpdates = async () => { throw Error("offline"); };
  await controller.check();
  s.updater.emit("error", Error("offline"));
});
test("downloaded update waits for consent and Later schedules another offer", async () => {
  const s = setup(); startUpdater(s.options);
  s.updater.emit("update-downloaded");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(s.counts().installs, 0);
  assert.equal(s.timers[1].ms, 30 * 60 * 1000);
  s.options.dialog.showMessageBox = async () => ({ response: 1 });
  await s.timers[1].fn();
  assert.equal(s.counts().installs, 1);
});

test("quitting does not install an update or perform later queued checks", async () => {
  const s = setup(); const controller = startUpdater(s.options);
  s.options.app.emit("before-quit");
  await controller.check();
  s.updater.emit("update-downloaded");
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(s.counts(), { checks: 0, installs: 0 });
});
