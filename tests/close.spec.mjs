// BLOODRUN ARCADE — Close / uninstall resistance tests

import { test, expect } from '@playwright/test';
import { desktopReady, launchApp, FLAGS } from './helpers.mjs';

// Via ESC on boot splash — must use acked:false so launch goes to boot
async function openModalViaBoot(page) {
  await desktopReady(page, { acked: false });
  await page.locator('.w95-desktop-icon', { hasText: 'BLOODRUN.exe' }).dblclick();
  await page.waitForSelector('.boot-card', { timeout: 10000 });
  await page.keyboard.press('Escape');
  await page.waitForSelector('text=Add/Remove Programs', { timeout: 5000 });
}

test.describe('uninstall modal — triggers', () => {
  test('Start → Shut Down requests app closure without the refusal modal', async ({ page }) => {
    await desktopReady(page);
    await page.evaluate(() => {
      window.__closeRequested = false;
      window.close = () => { window.__closeRequested = true; };
    });
    await page.locator('.w95-start-btn').click();
    await page.getByText('Shut Down…', { exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.__closeRequested)).toBe(true);
    await expect(page.getByText('Add/Remove Programs', { exact: true })).toHaveCount(0);
  });

  test('ESC on boot splash shows uninstall modal', async ({ page }) => {
    await openModalViaBoot(page);
    await expect(page.locator('text=Add/Remove Programs').first()).toBeVisible();
  });
});

test.describe('uninstall modal — content', () => {
  test('shows error code 0x80004005', async ({ page }) => {
    await openModalViaBoot(page);
    await expect(page.locator('text=0x80004005').first()).toBeVisible();
  });

  test('references CSG-DSC-04A seal', async ({ page }) => {
    await openModalViaBoot(page);
    await expect(page.locator('text=CSG-DSC-04A').first()).toBeVisible();
  });

  // Helper: invoke the Details >> button's React onClick via the fiber tree.
  // Must match "Details >>" (the modal's button) not the plain "Details"
  // button in the CSG notification window, which appears earlier in the DOM.
  async function clickDetailsBtn(page) {
    await page.evaluate(() => {
      // Match only the modal's Details button — it contains ">" unlike the CSG notice's "Details"
      const btn = [...document.querySelectorAll('.w95-btn')]
        .find(b => /Details\s*[<>]/.test(b.textContent));
      if (!btn) return;
      const fiberKey = Object.keys(btn).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
      let fiber = btn[fiberKey];
      while (fiber) {
        const onClick = fiber.memoizedProps?.onClick ?? fiber.pendingProps?.onClick;
        if (onClick) { onClick({ type: 'click', stopPropagation: () => {}, preventDefault: () => {} }); break; }
        fiber = fiber.return;
      }
    });
    await page.waitForTimeout(400);
  }

  test('Details >> expands error log with registry entries', async ({ page }) => {
    await openModalViaBoot(page);
    await clickDetailsBtn(page);
    await expect(page.locator('text=HKLM').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=ERROR_ACCESS_DENIED').first()).toBeVisible();
    await expect(page.locator('text=decommissioned 2003').first()).toBeVisible();
  });

  test('Details >> toggles closed again', async ({ page }) => {
    await openModalViaBoot(page);
    await clickDetailsBtn(page);
    await page.waitForSelector('text=HKLM', { timeout: 5000 });
    await clickDetailsBtn(page);
    await expect(page.locator('text=HKLM').first()).not.toBeVisible({ timeout: 3000 });
  });

  test('boot abort shows correct error title', async ({ page }) => {
    await openModalViaBoot(page);
    await expect(page.locator('text=Setup cannot be aborted').first()).toBeVisible();
  });
});

test.describe('uninstall modal — dismiss', () => {
  test('OK on boot-reason dismisses modal and stays on boot screen', async ({ page }) => {
    await openModalViaBoot(page);
    await page.locator('.w95-btn.default').first().click({ force: true });
    // 'boot' reason → no window.close, screen stays at 'boot' (boot card still showing)
    await expect(page.locator('text=Add/Remove Programs')).not.toBeVisible({ timeout: 3000 });
    await expect(page.locator('.boot-card')).toBeVisible({ timeout: 3000 });
  });

  test('OK button dismisses modal', async ({ page }) => {
    await openModalViaBoot(page);
    // Click OK via native DOM — avoids competing with boot screen's Enter handler
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('.w95-btn.default')].find(b => b.textContent.includes('OK'));
      btn?.click();
    });
    await expect(page.locator('text=Add/Remove Programs')).not.toBeVisible({ timeout: 3000 });
  });

  test('Escape key dismisses modal', async ({ page }) => {
    await openModalViaBoot(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('text=Add/Remove Programs')).not.toBeVisible({ timeout: 3000 });
  });
});
