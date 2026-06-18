// BLOODRUN ARCADE — Installer flow tests

import { test, expect } from '@playwright/test';
import { launchApp, readFlag, FLAGS } from './helpers.mjs';

test.describe('installer — first-run gate', () => {
  test('uninstalled user lands on installer, not desktop', async ({ page }) => {
    await launchApp(page, { [FLAGS.installed]: false });
    await expect(page.locator('.installer-step-body').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.w95-taskbar')).not.toBeVisible();
  });

  test('installed user lands on desktop, not installer', async ({ page }) => {
    await launchApp(page, { [FLAGS.installed]: true }, '?e2e=1');
    await expect(page.locator('.w95-taskbar')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.installer-banner')).not.toBeVisible();
  });
});

test.describe('installer — wizard navigation', () => {
  test.beforeEach(async ({ page }) => {
    await launchApp(page, { [FLAGS.installed]: false });
    await page.waitForSelector('.installer-step-body', { timeout: 8000 });
  });

  test('welcome step renders title and Next button', async ({ page }) => {
    await expect(page.locator('text=Welcome to the BLOODRUN Setup')).toBeVisible();
    await expect(page.locator('.w95-btn.default').first()).toContainText('Next');
  });

  test('Next advances to license step', async ({ page }) => {
    await page.locator('.w95-btn.default').first().click();
    await expect(page.locator('text=License Agreement').first()).toBeVisible({ timeout: 5000 });
  });

  test('license: Next disabled until accept radio clicked', async ({ page }) => {
    await page.locator('.w95-btn.default').first().click();
    await page.waitForSelector('text=License Agreement');
    // When not accepted, button has class "w95-btn disabled" (not "w95-btn default")
    const disabledBtn = page.locator('.w95-btn.disabled', { hasText: 'Next' }).first();
    await expect(disabledBtn).toBeVisible({ timeout: 3000 });
    await page.locator('text=I accept the terms').first().click();
    // After accepting, button becomes "w95-btn default"
    await expect(page.locator('.w95-btn.default', { hasText: 'Next' }).first()).toBeVisible({ timeout: 3000 });
  });

  test('full wizard: welcome → license → dest → progress → finish', async ({ page }) => {
    await page.locator('.w95-btn.default').first().click();
    await page.locator('text=I accept the terms').first().click();
    await page.locator('.w95-btn.default').first().click();
    await page.waitForSelector('text=Choose Destination Location', { timeout: 5000 });
    await page.locator('.w95-btn.default').first().click();
    await page.waitForSelector('text=Installing BLOODRUN.exe', { timeout: 5000 });
    await page.waitForSelector('text=InstallShield Wizard Complete', { timeout: 20000 });
    await expect(page.locator('.w95-btn.default').first()).toContainText('Finish');
  });

  test('cancel shows uninstall-failed modal', async ({ page }) => {
    await page.locator('.w95-btn', { hasText: 'Cancel' }).first().click();
    await expect(page.locator('text=Add/Remove Programs').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('installer — state persistence', () => {
  test('completing install writes installed flag', async ({ page }) => {
    await launchApp(page, { [FLAGS.installed]: false });
    await page.waitForSelector('.installer-step-body', { timeout: 8000 });

    await page.locator('.w95-btn.default').first().click();
    await page.locator('text=I accept the terms').first().click();
    await page.locator('.w95-btn.default').first().click();
    await page.waitForSelector('text=Choose Destination Location');
    await page.locator('.w95-btn.default').first().click();
    await page.waitForSelector('text=InstallShield Wizard Complete', { timeout: 20000 });
    await page.locator('.w95-btn.default').first().click();

    await page.waitForSelector('.w95-taskbar', { timeout: 10000 });
    expect(await readFlag(page, FLAGS.installed)).toBe(true);
  });

  test('finish always goes through desktop, not straight to boot', async ({ page }) => {
    await launchApp(page, { [FLAGS.installed]: false });
    await page.waitForSelector('.installer-step-body', { timeout: 8000 });

    await page.locator('.w95-btn.default').first().click();
    await page.locator('text=I accept the terms').first().click();
    await page.locator('.w95-btn.default').first().click();
    await page.waitForSelector('text=Choose Destination Location');
    await page.locator('.w95-btn.default').first().click();
    await page.waitForSelector('text=InstallShield Wizard Complete', { timeout: 20000 });
    await page.locator('.w95-btn.default').first().click();

    await page.waitForSelector('.w95-taskbar', { timeout: 10000 });
    await expect(page.locator('.boot-card')).not.toBeVisible();
  });

  test('"Run BLOODRUN.exe now" auto-launches game sequence without any click', async ({ page }) => {
    // Full install with the default "Run now" checkbox checked.
    // After the desktop startup animation clears (~5.8s), the app fires doLaunch()
    // automatically — the user never needs to touch anything.
    await launchApp(page, { [FLAGS.installed]: false });
    await page.waitForSelector('.installer-step-body', { timeout: 8000 });

    // Walk through all installer steps
    await page.locator('.w95-btn.default').first().click();          // Welcome → Next
    await page.locator('text=I accept the terms').first().click();   // accept license
    await page.locator('.w95-btn.default').first().click();          // License → Next
    await page.waitForSelector('text=Choose Destination Location');
    await page.locator('.w95-btn.default').first().click();          // Dest → Install
    await page.waitForSelector('text=InstallShield Wizard Complete', { timeout: 20000 });

    // Verify "Run BLOODRUN.exe now" is checked by default on Finish screen
    const runNowChecked = await page.evaluate(() => {
      const label = [...document.querySelectorAll('label, span')].find(
        el => el.textContent.includes('Run BLOODRUN.exe now')
      );
      const box = label?.querySelector?.('.w95-check-box') ?? label?.previousElementSibling;
      return box?.classList.contains('checked') ?? false;
    });
    expect(runNowChecked).toBe(true);

    await page.locator('.w95-btn.default').first().click();           // Finish

    // Desktop must appear first (mandatory gateway)
    await page.waitForSelector('.w95-taskbar', { timeout: 10000 });

    // Without ANY user interaction the game sequence should auto-launch.
    // The auto-launch fires after the startup animation (~5.8s post-desktop).
    // We allow up to 12s total from desktop appearing to game sequence starting.
    await expect(
      page.locator('.boot-card, .csg-notice, .scene--title, .scene--game')
    ).toBeVisible({ timeout: 12000 });
  });
});
