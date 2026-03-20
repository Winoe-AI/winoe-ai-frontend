import path from 'path';
import { defineConfig, devices } from '@playwright/test';

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const baseURL = process.env.QA_E2E_BASE_URL ?? 'http://127.0.0.1:3200';
const isCI = Boolean(process.env.CI);
const PERF_GREP = /@perf\b/;
const artifactsDir = process.env.QA_E2E_ARTIFACTS_DIR?.trim()
  ? path.resolve(process.env.QA_E2E_ARTIFACTS_DIR)
  : path.join(
      repoRoot,
      'qa_verifications',
      'E2E-Flow-QA',
      'e2e_flow_qa_latest',
      'artifacts',
      'flow-qa-artifacts',
    );

export default defineConfig({
  testDir: '.',
  testMatch: ['**/*.spec.ts'],
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  retries: 1,
  fullyParallel: true,
  globalSetup: path.join(__dirname, 'global-setup.ts'),
  outputDir: path.join(artifactsDir, 'test-results'),
  reporter: [
    ['list'],
    [
      'json',
      {
        outputFile: path.join(artifactsDir, 'results.json'),
      },
    ],
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.QA_E2E_BASE_URL
    ? undefined
    : {
        command: isCI
          ? 'npm run build && npm run start -- -p 3200'
          : 'npm run dev -- -p 3200',
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 120_000,
      },
  projects: [
    {
      name: 'chromium',
      grepInvert: PERF_GREP,
      testIgnore: ['**/responsive.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      grepInvert: PERF_GREP,
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'perf-serial',
      grep: PERF_GREP,
      fullyParallel: false,
      workers: 1,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
