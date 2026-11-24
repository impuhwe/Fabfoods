import { defineConfig } from '@playwright/test';

const qaApiPort = process.env.QA_API_PORT ?? '5001';
const e2eWebPort = process.env.E2E_WEB_PORT ?? '5174';
const e2eClientOrigin = `http://localhost:${e2eWebPort}`;
const qaApiOrigin = `http://localhost:${qaApiPort}`;

export default defineConfig({
  testDir: './qa/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: e2eClientOrigin,
    channel: 'chrome',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'node qa/server.mjs',
      url: `${qaApiOrigin}/api/v1/health/live`,
      env: {
        QA_API_PORT: qaApiPort,
        E2E_CLIENT_ORIGIN: e2eClientOrigin,
      },
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `node ../node_modules/vite/bin/vite.js --host localhost --port ${e2eWebPort}`,
      cwd: './client',
      url: e2eClientOrigin,
      env: {
        API_PROXY_TARGET: qaApiOrigin,
        VITE_API_URL: '/api/v1',
      },
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
