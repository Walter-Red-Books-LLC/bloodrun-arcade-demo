// BLOODRUN ARCADE — shared test helpers

export const FLAGS = {
  installed:   'wr_holmn_arcade_installed_v1',
  completed:   'wr_holmn_arcade_completed_v1',
  noticeFound: 'wr_holmn_arcade_notice_found_v1',
  acked:       'wr_holmn_arcade_acked_v1',
};

// Launch the app, seeding localStorage flags BEFORE React mounts.
export async function launchApp(page, flags = {}, queryString = '') {
  await page.addInitScript((f) => {
    for (const [k, v] of Object.entries(f)) {
      if (v) localStorage.setItem(k, '1');
      else    localStorage.removeItem(k);
    }
  }, flags);
  await page.goto('/BLOODRUN.exe.html' + queryString);
  await page.waitForSelector('#root > *', { timeout: 10000 });
  // Exercise the launch-time legal gate through its visible control.
  const accept = page.getByRole('button', { name: 'ACCEPT', exact: true });
  if (await accept.isVisible()) await accept.click();
}

// Wait for the desktop startup animation overlay to fully disappear.
export async function waitForDesktop(page) {
  await page.waitForSelector('.w95-taskbar', { timeout: 12000 });
  await page.waitForFunction(
    () => !document.querySelector('.desktop-startup-overlay'),
    { timeout: 15000, polling: 200 }
  );
}

// Installed + acked + ?e2e=1 (skips BIOS animation). Desktop ready immediately.
export async function desktopReady(page, opts = {}) {
  const { acked = true } = opts;
  await launchApp(page, {
    [FLAGS.installed]: true,
    [FLAGS.acked]:     acked,
    [FLAGS.completed]: false,
  }, '?e2e=1');
  await page.waitForSelector('.w95-taskbar', { timeout: 12000 });
  await waitForDesktop(page);
}

// Navigate to game screen as fast as possible via ?artifact=1.
// TitleMenu renders with class "scene" (not "scene--title"), so wait for .menu-item.
export async function intoGame(page) {
  await launchApp(page, {
    [FLAGS.installed]: true,
    [FLAGS.acked]:     true,
    [FLAGS.completed]: false,
  }, '?artifact=1');
  await page.waitForSelector('.menu-item', { timeout: 10000 }); // title screen is loaded
  await page.keyboard.press('Enter');  // START
  await page.waitForSelector('.scene--game', { timeout: 10000 });
  await page.waitForTimeout(500);
}

// Read a localStorage flag
export async function readFlag(page, key) {
  return page.evaluate(k => localStorage.getItem(k) === '1', key);
}

// Hold a keyboard key for ms milliseconds
export async function holdKey(page, key, ms) {
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
}
