// BLOODRUN ARCADE — Win95 desktop tests

import { test, expect } from '@playwright/test';
import { desktopReady, launchApp, readFlag, FLAGS } from './helpers.mjs';

test.beforeEach(async ({ page }) => {
  await desktopReady(page); // acked:true by default
});

test.describe('desktop — startup', () => {
  test('taskbar is visible', async ({ page }) => {
    await expect(page.locator('.w95-taskbar')).toBeVisible();
  });
  test('file manager window is open by default', async ({ page }) => {
    await expect(page.locator('text=C:\\PROGRAM FILES\\CSG\\DSC04A')).toBeVisible();
  });
  test('CSG notification window is open by default', async ({ page }) => {
    await expect(page.locator('.w95-titlebar', { hasText: 'Catalyst Systems Group' }).first()).toBeVisible();
  });
});

test.describe('desktop — icon interactions', () => {
  test('double-click My Computer opens the My Computer window', async ({ page }) => {
    await page.locator('.w95-desktop-icon', { hasText: 'My Computer' }).dblclick();
    await expect(page.locator('text=Local Disk (C:)').first()).toBeVisible({ timeout: 5000 });
  });
  test('double-click Network Neighborhood shows network error', async ({ page }) => {
    await page.locator('.w95-desktop-icon', { hasText: 'Network Neighborhood' }).dblclick();
    await expect(page.locator('text=Network path not found').first()).toBeVisible({ timeout: 5000 });
  });
  test('double-click Recycle Bin shows SAVE2.SAV', async ({ page }) => {
    await page.locator('.w95-desktop-icon', { hasText: 'Recycle Bin' }).dblclick();
    await expect(page.locator('text=SAVE2.SAV').first()).toBeVisible({ timeout: 5000 });
  });
  test('double-click SAVE2.SAV desktop icon shows corrupt error', async ({ page }) => {
    await page.locator('.w95-desktop-icon', { hasText: 'SAVE2.SAV' }).dblclick();
    await expect(page.locator('text=Terminal state unresolvable').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('desktop — file manager rows', () => {
  async function dblClickRow(page, name) {
    const row = page.locator('.w95-inset div', { hasText: name })
                     .filter({ hasText: /KB|File|Application|Document/ })
                     .first();
    await row.dblclick();
  }
  test('double-click README.WRI opens lore text', async ({ page }) => {
    await dblClickRow(page, 'README.WRI');
    await expect(page.locator('text=This is a diagnostic distribution').first()).toBeVisible({ timeout: 5000 });
  });
  test('double-click BLOODRUN.DAT shows access denied', async ({ page }) => {
    await dblClickRow(page, 'BLOODRUN.DAT');
    await expect(page.locator('text=Access Denied').first()).toBeVisible({ timeout: 5000 });
  });
  test('double-click UNINST.EXE shows prohibited error', async ({ page }) => {
    await dblClickRow(page, 'UNINST.EXE');
    await expect(page.locator('text=not permitted').first()).toBeVisible({ timeout: 5000 });
  });
  test('double-click SAVE0.SAV shows run record', async ({ page }) => {
    await dblClickRow(page, 'SAVE0.SAV');
    await expect(page.locator('text=OPERATOR').first()).toBeVisible({ timeout: 5000 });
  });
  test('double-click SAVE2.SAV row shows corrupt warning', async ({ page }) => {
    const row = page.locator('.w95-inset div', { hasText: 'SAVE2.SAV' })
                     .filter({ hasText: /CORRUPT/ }).first();
    await row.dblclick();
    await expect(page.locator('text=corrupt').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('desktop — start menu', () => {
  test('clicking Start opens the start menu', async ({ page }) => {
    await page.locator('.w95-start-btn').click();
    await expect(page.locator('text=Programs').first()).toBeVisible({ timeout: 3000 });
  });
  test('Start → Documents opens README window', async ({ page }) => {
    await page.locator('.w95-start-btn').click();
    await page.locator('text=Documents').first().click();
    await expect(page.locator('text=This is a diagnostic distribution').first()).toBeVisible({ timeout: 5000 });
  });
  test('Start → Settings opens My Computer window', async ({ page }) => {
    await page.locator('.w95-start-btn').click();
    await page.locator('text=Settings').first().click();
    await expect(page.locator('text=Local Disk (C:)').first()).toBeVisible({ timeout: 5000 });
  });
  test('clicking away dismisses start menu', async ({ page }) => {
    await page.locator('.w95-start-btn').click();
    await expect(page.locator('text=Programs').first()).toBeVisible();
    await page.mouse.click(600, 300);
    await expect(page.locator('text=Programs').first()).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe('desktop — context menu', () => {
  test('right-click desktop shows context menu', async ({ page }) => {
    await page.locator('.w95').first().click({ button: 'right', position: { x: 400, y: 300 } });
    await expect(page.locator('text=Properties').first()).toBeVisible({ timeout: 3000 });
  });
  test('Properties opens Display Properties with 4 tabs', async ({ page }) => {
    await page.locator('.w95').first().click({ button: 'right', position: { x: 400, y: 300 } });
    await page.locator('text=Properties').first().click();
    await expect(page.locator('text=Display Properties').first()).toBeVisible({ timeout: 5000 });
    for (const tab of ['Background', 'Screen Saver', 'Appearance', 'Settings']) {
      await expect(page.locator(`text=${tab}`).first()).toBeVisible();
    }
  });
  test('Display Properties tab switching works', async ({ page }) => {
    await page.locator('.w95').first().click({ button: 'right', position: { x: 400, y: 300 } });
    await page.locator('text=Properties').first().click();
    await page.waitForSelector('text=Display Properties');
    await page.locator('text=Screen Saver').first().click();
    await expect(page.locator('text=CSG Diagnostic').first()).toBeVisible({ timeout: 3000 });
    await page.locator('text=Settings').first().click();
    await expect(page.locator('text=CSG Diagnostic Video').first()).toBeVisible({ timeout: 3000 });
  });
});

test.describe('desktop — system tray', () => {
  test('clicking tray shows CSG popup', async ({ page }) => {
    await page.locator('.w95-tray').click();
    await expect(page.locator('text=Diagnostic process active').first()).toBeVisible({ timeout: 3000 });
  });
});

test.describe('desktop — window management', () => {
  async function openMyComputer(page) {
    await page.locator('.w95-desktop-icon', { hasText: 'My Computer' }).dblclick();
    await page.waitForSelector('text=Local Disk (C:)', { timeout: 5000 });
    return page.locator('.w95-window', { hasText: 'My Computer' }).last();
  }

  test('minimize hides window body and keeps taskbar entry', async ({ page }) => {
    const win = await openMyComputer(page);
    await win.locator('.w95-tb-btn').first().click(); // minimize
    // W95Window returns null when minimized, so the content disappears
    await expect(page.locator('text=Local Disk (C:)')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('.w95-task', { hasText: 'My Computer' })).toBeVisible();
  });

  test('maximize expands window to fill desktop', async ({ page }) => {
    const win = await openMyComputer(page);
    await win.locator('.w95-tb-btn').nth(1).click(); // maximize
    await page.waitForTimeout(300); // allow React re-render
    const box = await win.boundingBox();
    expect(box.width).toBeGreaterThan(900);
  });

  test('close button removes window from desktop', async ({ page }) => {
    const win = await openMyComputer(page);
    await win.locator('.w95-tb-btn').last().click();
    await expect(page.locator('text=Local Disk (C:)')).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe('desktop → game launch', () => {
  // acked:true → launch goes to title (not boot)
  test('double-clicking BLOODRUN.exe shows title menu', async ({ page }) => {
    await page.locator('.w95-desktop-icon', { hasText: 'BLOODRUN.exe' }).dblclick();
    await expect(page.locator('.menu-item').first()).toBeVisible({ timeout: 8000 });
  });

  // acked:false → launch goes through boot first (tested more thoroughly in boot-license.spec)
  test('unacked user double-clicking BLOODRUN.exe triggers boot', async ({ page }) => {
    // Use a fresh launchApp with acked:false to avoid the addInitScript re-run issue
    await launchApp(page, { [FLAGS.installed]: true, [FLAGS.acked]: false }, '?e2e=1');
    await page.waitForSelector('.w95-taskbar', { timeout: 8000 });
    await page.locator('.w95-desktop-icon', { hasText: 'BLOODRUN.exe' }).dblclick();
    await expect(page.locator('.boot-card')).toBeVisible({ timeout: 10000 });
  });

  test('Acknowledge CSG notice launches game flow', async ({ page }) => {
    await page.locator('.w95-btn.default', { hasText: 'Acknowledge' }).first().click();
    // acked:true → goes to title
    await expect(page.locator('.menu-item').first()).toBeVisible({ timeout: 8000 });
  });
});
