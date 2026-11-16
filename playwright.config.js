import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './qa/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    channel: 'chrome',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'node qa/server.mjs',
      url: 'http://127.0.0.1:5000/api/v1/health/live',
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npx.cmd vite --host 127.0.0.1 --port 5173',
      cwd: './client',
      url: 'http://127.0.0.1:5173',
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
