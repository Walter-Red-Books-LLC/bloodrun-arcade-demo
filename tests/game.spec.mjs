// BLOODRUN ARCADE — Game runtime tests
// Uses ?artifact=1 to skip desktop/boot/license and land directly on title menu.
// TitleMenu renders with class "scene" (not "scene--title"), so we wait for .menu-item.

import { test, expect } from '@playwright/test';
import { intoGame, launchApp, holdKey, FLAGS } from './helpers.mjs';

async function getHeartCount(page) {
  return page.locator('.heart:not(.empty)').count();
}

test.describe('game — zone loading', () => {
  test('chapel zone renders with correct data-zone', async ({ page }) => {
    await intoGame(page);
    await expect(page.locator('[data-zone="chapel"]')).toBeVisible({ timeout: 5000 });
  });

  test('HUD shows CHAPEL zone name', async ({ page }) => {
    await intoGame(page);
    await expect(page.locator('.hud-zone-name').first()).toContainText('CHAPEL');
  });

  test('game canvas is 640×320', async ({ page }) => {
    await intoGame(page);
    const canvas = page.locator('.game-canvas').first();
    await expect(canvas).toBeVisible();
    expect(await canvas.getAttribute('width')).toBe('640');
    expect(await canvas.getAttribute('height')).toBe('320');
  });

  test('run timer starts and advances', async ({ page }) => {
    await intoGame(page);
    const hud = page.locator('.hud-value').first();
    const t1 = await hud.textContent();
    await page.waitForTimeout(2000);
    const t2 = await hud.textContent();
    expect(t2).not.toBe(t1);
  });

  test('player starts with 3 hearts', async ({ page }) => {
    await intoGame(page);
    await page.waitForTimeout(300);
    expect(await getHeartCount(page)).toBe(3);
  });
});

test.describe('game — zone switching', () => {
  test('sluice zone button switches zone', async ({ page }) => {
    await intoGame(page);
    await page.locator('.zone-btn--sluice').first().click({ force: true });
    await expect(page.locator('[data-zone="sluice"]')).toBeVisible({ timeout: 5000 });
  });

  test('vault zone button switches zone', async ({ page }) => {
    await intoGame(page);
    await page.locator('.zone-btn--vault').first().click({ force: true });
    await expect(page.locator('[data-zone="vault"]')).toBeVisible({ timeout: 5000 });
  });

  test('zone switch resets run timer', async ({ page }) => {
    await intoGame(page);
    await page.waitForTimeout(2000);
    await page.locator('.zone-btn--sluice').first().click({ force: true });
    await page.waitForSelector('[data-zone="sluice"]');
    const t = await page.locator('.hud-value').first().textContent();
    expect(t).toMatch(/^00:00/);
  });
});

test.describe('game — player movement', () => {
  test('ArrowRight changes the canvas', async ({ page }) => {
    await intoGame(page);
    const snap1 = await page.locator('.game-canvas').screenshot();
    await holdKey(page, 'ArrowRight', 800);
    const snap2 = await page.locator('.game-canvas').screenshot();
    expect(snap2).not.toEqual(snap1);
  });

  test('jump key (x) changes canvas', async ({ page }) => {
    await intoGame(page);
    const snap1 = await page.locator('.game-canvas').screenshot();
    await page.keyboard.press('x');
    await page.waitForTimeout(400);
    const snap2 = await page.locator('.game-canvas').screenshot();
    expect(snap2).not.toEqual(snap1);
  });
});

test.describe('game — pickup collection', () => {
  test('game canvas changes as player walks through coin area', async ({ page }) => {
    await intoGame(page);
    // Snapshot before walking to coin area
    const before = await page.locator('.game-canvas').screenshot();
    // Walk far right — coins at x=680, 1260, 1860. 5s at ~138px/s ≈ 690px.
    await holdKey(page, 'ArrowRight', 5000);
    const after = await page.locator('.game-canvas').screenshot();
    // Canvas must have changed (player moved, world scrolled)
    expect(after).not.toEqual(before);
    // Player must still be alive (hearts element exists)
    await expect(page.locator('.heart').first()).toBeVisible();
  });
});

test.describe('game — input strip', () => {
  test('game shows MOVE / JUMP / ATTACK hints', async ({ page }) => {
    await intoGame(page);
    const strip = page.locator('.input-strip').first();
    await expect(strip).toContainText('MOVE');
    await expect(strip).toContainText('JUMP');
    await expect(strip).toContainText('ATTACK');
  });
});

test.describe('game — ESC returns to desktop', () => {
  test('ESC from game goes back to desktop', async ({ page }) => {
    await intoGame(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('.w95-taskbar')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('game — archive screen', () => {
  test('archive screen accessible from title menu', async ({ page }) => {
    await launchApp(page, { [FLAGS.installed]: true, [FLAGS.acked]: true }, '?artifact=1');
    await page.waitForSelector('.menu-item', { timeout: 8000 });
    await page.keyboard.press('ArrowDown'); // OPTIONS
    await page.keyboard.press('ArrowDown'); // ARCHIVE
    await page.keyboard.press('Enter');
    await expect(page.locator('text=DIAGNOSTIC ARCHIVE').first()).toBeVisible({ timeout: 5000 });
    const rows = await page.locator('.archive-row:not(.head)').count();
    expect(rows).toBeGreaterThan(0);
    await page.keyboard.press('Escape');
    await expect(page.locator('.menu-item').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('state isolation', () => {
  test('arcade writes no bloodrun.exe core localStorage keys', async ({ page }) => {
    await launchApp(page, { [FLAGS.installed]: true, [FLAGS.acked]: true }, '?e2e=1');
    await page.waitForSelector('.w95-taskbar', { timeout: 8000 });
    const coreKeys = ['wr_login_user', 'wr_login_tier', 'bloodrun.installed', 'bloodrun.completed'];
    const vals = await page.evaluate(ks => ks.map(k => localStorage.getItem(k)), coreKeys);
    expect(vals.every(v => v === null)).toBe(true);
  });

  test('all arcade localStorage keys use wr_holmn_arcade_ prefix', async ({ page }) => {
    await launchApp(page, { [FLAGS.installed]: true, [FLAGS.acked]: true }, '?e2e=1');
    await page.waitForSelector('.w95-taskbar', { timeout: 8000 });
    const keys = await page.evaluate(() => Object.keys(localStorage));
    const arcade = keys.filter(k => k.startsWith('wr_') || k.startsWith('bloodrun'));
    for (const k of arcade) {
      expect(k).toMatch(/^wr_holmn_arcade_/);
    }
  });
});
