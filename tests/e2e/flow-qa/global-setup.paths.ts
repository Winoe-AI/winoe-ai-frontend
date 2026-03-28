import path from 'path';
import type { FullConfig } from '@playwright/test';

export type RolePreset = {
  fileName: string;
  permissions: string[];
  roles: string[];
};

export function resolveBaseURL(config: FullConfig): string {
  const fromProject = config.projects.find(
    (project) => project.name === 'chromium',
  )?.use.baseURL;
  if (typeof fromProject === 'string' && fromProject.trim()) return fromProject;

  const fromUse = config.use?.baseURL;
  if (typeof fromUse === 'string' && fromUse.trim()) return fromUse;

  return process.env.QA_E2E_BASE_URL ?? 'http://127.0.0.1:3200';
}

export function resolveStorageDir(repoRoot: string): string {
  const raw = process.env.QA_E2E_STORAGE_DIR?.trim();
  if (!raw) {
    return path.join(
      repoRoot,
      'qa_verifications',
      'E2E-Flow-QA',
      'e2e_flow_qa_latest',
      'artifacts',
      'flow-qa-fixtures',
      'storage',
    );
  }
  return path.isAbsolute(raw) ? raw : path.resolve(repoRoot, raw);
}
