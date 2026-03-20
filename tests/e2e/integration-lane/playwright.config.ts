import path from 'path';
import { defineConfig, devices } from '@playwright/test';

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const baseURL = process.env.E2E_INTEGRATION_BASE_URL ?? 'http://127.0.0.1:3300';
const artifactsDir = process.env.E2E_INTEGRATION_ARTIFACTS_DIR?.trim()
  ? path.resolve(process.env.E2E_INTEGRATION_ARTIFACTS_DIR)
  : path.join(
      repoRoot,
      'qa_verifications',
      'E2E-Flow-QA',
      'e2e_flow_qa_latest',
      'artifacts',
      'integration-artifacts',
    );

export default defineConfig({
  testDir: '.',
  testMatch: ['**/*.spec.ts'],
  timeout: 90_000,
  expect: {
    timeout: 15_000,
  },
  retries: 0,
  fullyParallel: false,
  globalSetup: path.join(__dirname, '..', 'flow-qa', 'global-setup.ts'),
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
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
