// BLOODRUN ARCADE — Boot splash + license notice tests

import { test, expect } from '@playwright/test';
import { launchApp, desktopReady, readFlag, FLAGS } from './helpers.mjs';

// Reach boot screen — must use acked:false so launch goes to boot, not title
async function toBootScreen(page) {
  await desktopReady(page, { acked: false });
  await page.locator('.w95-desktop-icon', { hasText: 'BLOODRUN.exe' }).dblclick();
  await page.waitForSelector('.boot-card', { timeout: 10000 });
  // Input is intentionally dormant during POST; wait for the operator prompt.
  await expect(page.locator('.boot-card .row').filter({ hasText: 'PRESS [ENTER] TO ACKNOWLEDGE' })).toBeVisible({ timeout: 8000 });
}

async function toLicense(page) {
  await toBootScreen(page);
  await page.keyboard.press('Enter');
  await page.waitForSelector('.csg-notice', { timeout: 8000 });
  // Keyboard acknowledgement has its own 1.5-second reading delay.
  await page.waitForTimeout(1600);
}

test.describe('boot splash', () => {
  test('boot card is visible with CSG header', async ({ page }) => {
    await toBootScreen(page);
    await expect(page.locator('.boot-card')).toBeVisible();
    await expect(page.locator('text=CATALYST SYSTEMS GROUP').first()).toBeVisible();
  });

  test('POST log lines appear sequentially', async ({ page }) => {
    await toBootScreen(page);
    await expect(page.locator('text=POST').first()).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=WARNING').first()).toBeVisible({ timeout: 8000 });
  });

  test('progress bar container is rendered inside boot card', async ({ page }) => {
    await toBootScreen(page);
    await page.waitForSelector('.boot-card', { timeout: 8000 });
    // The boot splash uses a CSS-width-animated div inside .progress (not a <progress> element).
    const result = await page.evaluate(() => {
      const bar = document.querySelector('.boot-card .progress');
      if (!bar) return null;
      return { tag: bar.tagName, childCount: bar.children.length };
    });
    expect(result).not.toBeNull();
    expect(result.tag).toBe('DIV');
    expect(result.childCount).toBe(1); // inner fill div
  });

  test('Enter key advances to license screen', async ({ page }) => {
    await toBootScreen(page);
    await page.keyboard.press('Enter');
    await expect(page.locator('.csg-notice')).toBeVisible({ timeout: 6000 });
  });

  test('Space key advances to license screen', async ({ page }) => {
    await toBootScreen(page);
    await page.keyboard.press('Space');
    await expect(page.locator('.csg-notice')).toBeVisible({ timeout: 6000 });
  });
});

test.describe('license notice', () => {
  test('renders key CSG lore elements', async ({ page }) => {
    await toLicense(page);
    await expect(page.locator('text=Diagnostic Distribution Notice').first()).toBeVisible();
    await expect(page.locator('text=CSG does not assert authorship').first()).toBeVisible();
    await expect(page.locator('.stamp').first()).toBeVisible();
  });

  test('ACKNOWLEDGE button advances to title', async ({ page }) => {
    await toLicense(page);
    await page.locator('.csg-btn--primary').first().click({ force: true });
    await expect(page.locator('.menu-item').first()).toBeVisible({ timeout: 8000 });
  });

  test('Enter key accepts license', async ({ page }) => {
    await toLicense(page);
    await page.keyboard.press('Enter');
    await expect(page.locator('.menu-item').first()).toBeVisible({ timeout: 8000 });
  });

  test('DECLINE button returns to desktop', async ({ page }) => {
    await toLicense(page);
    await page.locator('.csg-btn:not(.csg-btn--primary)').first().click({ force: true });
    await expect(page.locator('.w95-taskbar')).toBeVisible({ timeout: 6000 });
  });

  test('Escape key declines and returns to desktop', async ({ page }) => {
    await toLicense(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('.w95-taskbar')).toBeVisible({ timeout: 6000 });
  });

  test('accepting writes the acked flag', async ({ page }) => {
    await toLicense(page);
    await page.locator('.csg-btn--primary').first().click({ force: true });
    await page.waitForSelector('.menu-item');
    expect(await readFlag(page, FLAGS.acked)).toBe(true);
  });
});

test.describe('acked flag — return user skips boot+license', () => {
  test('acked user goes straight to title on launch', async ({ page }) => {
    // acked:true → launch skips boot and goes straight to title
    await desktopReady(page, { acked: true });
    await page.locator('.w95-desktop-icon', { hasText: 'BLOODRUN.exe' }).dblclick();
    // Should skip boot/license and show title menu items directly
    await expect(page.locator('.menu-item').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.boot-card')).not.toBeVisible();
    await expect(page.locator('.csg-notice')).not.toBeVisible();
  });
});
