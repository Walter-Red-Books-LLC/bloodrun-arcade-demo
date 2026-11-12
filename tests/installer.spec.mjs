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
    await page.getByText('CSG Setup Complete', { exact: true }).waitFor({ timeout: 20000 });
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
    await page.getByText('CSG Setup Complete', { exact: true }).waitFor({ timeout: 20000 });
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
    await page.getByText('CSG Setup Complete', { exact: true }).waitFor({ timeout: 20000 });
    await page.locator('.w95-btn.default').first().click();

    await page.waitForSelector('.w95-taskbar', { timeout: 10000 });
    await expect(page.locator('.boot-card')).not.toBeVisible();
  });

  test('Finish leaves the cabinet dormant until the operator launches it', async ({ page }) => {
    // The demo requires a deliberate launch from the desktop after installation.
    await launchApp(page, { [FLAGS.installed]: false });
    await page.waitForSelector('.installer-step-body', { timeout: 8000 });

    // Walk through all installer steps
    await page.locator('.w95-btn.default').first().click();          // Welcome → Next
    await page.locator('text=I accept the terms').first().click();   // accept license
    await page.locator('.w95-btn.default').first().click();          // License → Next
    await page.waitForSelector('text=Choose Destination Location');
    await page.locator('.w95-btn.default').first().click();          // Dest → Install
    await page.getByText('CSG Setup Complete', { exact: true }).waitFor({ timeout: 20000 });

    await expect(page.getByText('Run BLOODRUN.exe now', { exact: true })).toHaveCount(0);

    await page.locator('.w95-btn.default').first().click();           // Finish

    // Desktop must appear first (mandatory gateway)
    await page.waitForSelector('.w95-taskbar', { timeout: 10000 });

    // Remain dormant past the former startup/auto-launch interval.
    await page.waitForTimeout(7000);
    await expect(page.locator('.boot-card, .csg-notice, .scene--game')).toHaveCount(0);
    await expect(page.locator('.w95-taskbar')).toBeVisible();
    await page.locator('.w95-desktop-icon', { hasText: 'BLOODRUN.exe' }).dblclick();
    await expect(page.locator('.boot-card')).toBeVisible();
  });
});
