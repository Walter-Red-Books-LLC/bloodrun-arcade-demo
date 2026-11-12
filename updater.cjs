"use strict";

function startUpdater({ app, dialog, autoUpdater, platform = process.platform, portable = !!process.env.PORTABLE_EXECUTABLE_DIR, schedule = setTimeout, repeat = setInterval, logger = console }) {
  if (!app.isPackaged || !["darwin", "win32"].includes(platform) || portable) return null;
  autoUpdater.allowPrerelease = true;
  autoUpdater.channel = "demo";
  // electron-updater's channel setter enables downgrades; disable after it.
  autoUpdater.allowDowngrade = false;
  autoUpdater.autoDownload = true;
  // Updates wait for an explicit restart decision; never close an active run.
  autoUpdater.autoInstallOnAppQuit = false;
  let busy = false;
  let stopped = false;
  let prompting = false;
  let retry = null;
  const check = async () => {
    if (busy || stopped || prompting) return;
    busy = true;
    try { await autoUpdater.checkForUpdates(); }
    catch (error) { logger.warn("[updater] Check unavailable:", error.message); }
    finally { busy = false; }
  };
  const offerRestart = async () => {
    if (prompting || stopped) return;
    prompting = true;
    try {
      const { response } = await dialog.showMessageBox({
        type: "info", title: "BLOODRUN DEMO update ready",
        message: "A demo update has downloaded.",
        detail: "Restarting ends the current session. Choose Later to keep playing; you will be asked again in 30 minutes.",
        buttons: ["Later", "Restart and update"], defaultId: 0, cancelId: 0,
        noLink: true
      });
      if (stopped) return;
      if (response === 1) autoUpdater.quitAndInstall();
      else { retry = schedule(offerRestart, 30 * 60 * 1000); retry.unref?.(); }
    } catch (error) { logger.warn("[updater] Restart prompt unavailable:", error.message); }
    finally { prompting = false; }
  };
  autoUpdater.on("error", error => logger.warn("[updater] Update unavailable:", error.message));
  autoUpdater.on("update-downloaded", offerRestart);
  const first = schedule(check, 15000);
  const periodic = repeat(check, 6 * 60 * 60 * 1000);
  first.unref?.(); periodic.unref?.();
  app.once("before-quit", () => {
    stopped = true;
    clearTimeout(first); clearInterval(periodic); clearTimeout(retry);
  });
  return { check };
}

module.exports = { startUpdater };
