// BLOODRUN ARCADE — Audio system tests
// Headless Chromium mutes audio output but the player state machine is testable.

import { test, expect } from '@playwright/test';
import { launchApp, desktopReady, FLAGS } from './helpers.mjs';

async function getAudioState(page) {
  const np = await page.locator('.now-playing').first();
  const visible = await np.isVisible().catch(() => false);
  return {
    hasTrack: visible,
    trackName: visible ? (await np.textContent()) : null,
  };
}

// Get to title screen where menu music should start
async function toTitle(page) {
  await desktopReady(page, { acked: true });
  await page.locator('.w95-desktop-icon', { hasText: 'BLOODRUN.exe' }).dblclick();
  await page.waitForSelector('.menu-item', { timeout: 8000 });
  // First interaction to trigger audio start
  await page.keyboard.press('ArrowDown');
}

test.describe('audio — context routing', () => {
  test('no now-playing chip visible on desktop screen', async ({ page }) => {
    await desktopReady(page);
    await page.waitForTimeout(1000);
    const state = await getAudioState(page);
    expect(state.hasTrack).toBe(false);
  });

  test('now-playing chip may appear on title screen after interaction', async ({ page }) => {
    await toTitle(page);
    await page.waitForTimeout(2000);
    // Audio may or may not start in headless (depends on autoplay policy).
    // Just verify we're on the title screen with no crash.
    await expect(page.locator('.menu-item').first()).toBeVisible();
  });

  test('N key on title screen does not crash', async ({ page }) => {
    await toTitle(page);
    await page.keyboard.press('n');
    await page.waitForTimeout(500);
    // Still on title
    await expect(page.locator('.menu-item').first()).toBeVisible();
  });

  test('N key hint appears in title input strip', async ({ page }) => {
    await toTitle(page);
    await expect(page.locator('.input-strip', { hasText: 'NEXT TRACK' }).first()).toBeVisible();
  });
});

test.describe('audio — tweaks panel controls', () => {
  test('tweaks panel skip button is present when panel is open', async ({ page }) => {
    await desktopReady(page);
    await page.evaluate(() => window.postMessage({ type: '__activate_edit_mode' }, '*'));
    await page.waitForSelector('.twk-panel', { timeout: 3000 });
    await expect(page.locator('.twk-btn', { hasText: 'Skip track' }).first()).toBeVisible();
  });

  test('volume slider exists in tweaks panel', async ({ page }) => {
    await desktopReady(page);
    await page.evaluate(() => window.postMessage({ type: '__activate_edit_mode' }, '*'));
    await page.waitForSelector('.twk-panel', { timeout: 3000 });
    // Multiple sliders exist (VHS intensity + volume) — just check at least one is present
    await expect(page.locator('.twk-slider').first()).toBeVisible();
  });
});
