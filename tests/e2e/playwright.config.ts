import path from 'path';
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000';
const isCI = Boolean(process.env.CI);
const baselineResultsJson = process.env.E2E_BASELINE_RESULTS_JSON?.trim()
  ? path.resolve(process.env.E2E_BASELINE_RESULTS_JSON)
  : path.join(__dirname, '..', '..', 'test-results', 'baseline-results.json');

export default defineConfig({
  testDir: '.',
  testMatch: ['**/*.spec.ts', '**/*.spec.tsx'],
  testIgnore: ['flow-qa/**', 'integration-lane/**'],
  timeout: 60_000,
  retries: 1,
  fullyParallel: true,
  globalSetup: path.join(__dirname, 'flow-qa', 'global-setup.ts'),
  reporter: [
    ['list'],
    [
      'json',
      {
        outputFile: baselineResultsJson,
      },
    ],
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: isCI
          ? 'npm run build && npm run start -- -p 3000'
          : 'npm run dev -- -p 3000',
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 120_000,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
