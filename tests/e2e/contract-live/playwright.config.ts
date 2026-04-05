import path from 'path';
import { defineConfig, devices } from '@playwright/test';

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const timestamp =
  process.env.CONTRACT_LIVE_TIMESTAMP?.trim() ||
  new Date().toISOString().replace(/[:.]/g, '-');
const evidenceDir = process.env.CONTRACT_LIVE_ARTIFACTS_DIR?.trim()
  ? path.resolve(process.env.CONTRACT_LIVE_ARTIFACTS_DIR)
  : path.join(
      repoRoot,
      'qa_verifications',
      'Contract-Live-QA',
      'contract_live_qa_latest',
      'artifacts',
      timestamp,
    );
const storageDir = process.env.QA_E2E_STORAGE_DIR?.trim()
  ? path.resolve(process.env.QA_E2E_STORAGE_DIR)
  : path.join(evidenceDir, 'storage');

process.env.QA_E2E_STORAGE_DIR = storageDir;

export default defineConfig({
  testDir: '.',
  testMatch: ['**/*.spec.ts'],
  timeout: 120_000,
  expect: {
    timeout: 15_000,
  },
  retries: 0,
  fullyParallel: false,
  globalSetup: path.join(__dirname, 'global-setup.ts'),
  outputDir: path.join(evidenceDir, 'playwright', 'test-results'),
  reporter: [
    ['list'],
    [
      'json',
      {
        outputFile: path.join(evidenceDir, 'playwright', 'results.json'),
      },
    ],
  ],
  use: {
    baseURL: process.env.CONTRACT_LIVE_BASE_URL ?? 'http://localhost:3000',
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
