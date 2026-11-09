import { defineConfig } from '@playwright/test';

// Locally the tests drive the installed Chrome. In CI Playwright's own Chromium is installed.
const channel = process.env.CI ? undefined : 'chrome';
const port = Number(process.env.PORT || 4321);
const base = process.env.SITE_BASE && process.env.SITE_BASE !== '/' ? process.env.SITE_BASE : '';

export default defineConfig({
  testDir: 'tests',
  timeout: 90_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  outputDir: 'test-results',
  use: {
    baseURL: `http://localhost:${port}${base}/`,
    channel,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npx astro preview --port ${port}`,
    url: `http://localhost:${port}${base}/`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    { name: 'phone', use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true } },
    { name: 'laptop', use: { viewport: { width: 1280, height: 800 } } },
  ],
});
