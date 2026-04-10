import fs from 'fs/promises';
import path from 'path';
import type { FullConfig } from '@playwright/test';
import { generateSessionCookie } from '@auth0/nextjs-auth0/testing';
import { loadEnvMap, readEnv, resolveClaimNamespace } from './global-setup.env';
import {
  resolveBaseURL,
  resolveStorageDir,
  type RolePreset,
} from './global-setup.paths';
import {
  buildSession,
  resolveDevIdentity,
  toStorageStateCookie,
  writeStorageState,
} from './global-setup.session';

export default async function globalSetup(config: FullConfig) {
  const repoRoot = path.resolve(__dirname, '..', '..', '..');
  const envMap = await loadEnvMap(repoRoot);
  const secret = readEnv('WINOE_AUTH0_SECRET', envMap);
  if (!secret) {
    throw new Error(
      'WINOE_AUTH0_SECRET is required to generate QA Playwright auth storage states.',
    );
  }

  const claimNamespace = resolveClaimNamespace(envMap);
  const baseURL = resolveBaseURL(config);
  const storageDir = resolveStorageDir(repoRoot);
  const presets: RolePreset[] = [
    {
      fileName: 'authenticated.json',
      permissions: ['talent_partner:access', 'candidate:access'],
      roles: ['talent_partner', 'candidate'],
    },
    {
      fileName: 'talent-partner-only.json',
      permissions: ['talent_partner:access'],
      roles: ['talent_partner'],
    },
    {
      fileName: 'candidate-only.json',
      permissions: ['candidate:access'],
      roles: ['candidate'],
    },
  ];

  await fs.mkdir(storageDir, { recursive: true });
  for (const preset of presets) {
    const identity = resolveDevIdentity(preset.roles);
    const session = buildSession({
      permissions: preset.permissions,
      roles: preset.roles,
      claimNamespace,
      accessToken: identity.accessToken,
      email: identity.email,
      sub: identity.sub,
    });
    const encrypted = await generateSessionCookie(session, { secret });
    const cookie = toStorageStateCookie({ value: encrypted, baseURL });
    await writeStorageState(path.join(storageDir, preset.fileName), cookie);
  }
}
