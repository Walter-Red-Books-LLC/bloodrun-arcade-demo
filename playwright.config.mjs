// BLOODRUN ARCADE — Playwright configuration
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir:        './tests',
  testMatch:      '**/*.spec.mjs',
  timeout:        45_000,      // per-test
  retries:        0,           // fail fast — no noisy retries
  workers:        1,           // one browser at a time — no spawn storm
  fullyParallel:  false,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'test-results/html-report', open: 'never' }],
  ],

  use: {
    baseURL:   'http://localhost:4848',
    headless:  true,
    viewport:  { width: 1280, height: 720 },
    actionTimeout:    8_000,
    navigationTimeout: 15_000,
  },

  outputDir: 'test-results/artifacts',

  webServer: {
    command:             'node tests/serve.cjs',
    url:                 'http://localhost:4848',
    timeout:             10_000,
    reuseExistingServer: true,   // don't restart between re-runs
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
