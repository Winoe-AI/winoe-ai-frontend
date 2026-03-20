import fs from 'fs/promises';
import path from 'path';
import type { FullConfig } from '@playwright/test';
import { generateSessionCookie } from '@auth0/nextjs-auth0/testing';

type EnvMap = Record<string, string>;

type RolePreset = {
  fileName: string;
  permissions: string[];
  roles: string[];
};

function parseEnvFile(content: string): EnvMap {
  const result: EnvMap = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;

    const key = match[1];
    let value = match[2] ?? '';

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

async function loadEnvMap(repoRoot: string): Promise<EnvMap> {
  const envPath = path.join(repoRoot, '.env.local');
  try {
    const content = await fs.readFile(envPath, 'utf8');
    return parseEnvFile(content);
  } catch {
    return {};
  }
}

function readEnv(key: string, map: EnvMap): string | null {
  const value = process.env[key] ?? map[key];
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveClaimNamespace(map: EnvMap): string {
  const raw = readEnv('NEXT_PUBLIC_TENON_AUTH0_CLAIM_NAMESPACE', map);
  const base = raw ?? 'https://tenon.ai';
  return base.endsWith('/') ? base : `${base}/`;
}

function toStorageStateCookie(options: {
  value: string;
  baseURL: string;
}): {
  name: string;
  value: string;
  domain: string;
  path: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'Lax';
  expires: number;
} {
  const target = new URL(options.baseURL);
  return {
    name: '__session',
    value: options.value,
    domain: target.hostname,
    path: '/',
    httpOnly: true,
    secure: target.protocol === 'https:',
    sameSite: 'Lax',
    expires: Math.floor(Date.now() / 1000) + 3600,
  };
}

async function writeStorageState(filePath: string, cookie: ReturnType<typeof toStorageStateCookie>) {
  const payload = {
    cookies: [cookie],
    origins: [],
  };

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');
}

function buildSession(options: {
  permissions: string[];
  roles: string[];
  claimNamespace: string;
  accessToken: string;
  email: string;
  sub: string;
}) {
  const now = Math.floor(Date.now() / 1000);
  const permissionsClaim = `${options.claimNamespace}permissions`;
  const rolesClaim = `${options.claimNamespace}roles`;
  const emailClaim = `${options.claimNamespace}email`;

  return {
    user: {
      sub: options.sub,
      name: 'QA E2E User',
      email: options.email,
      email_verified: true,
      permissions: options.permissions,
      roles: options.roles,
      [permissionsClaim]: options.permissions,
      [rolesClaim]: options.roles,
      [emailClaim]: options.email,
    },
    tokenSet: {
      accessToken: options.accessToken,
      expiresAt: now + 3600,
      token_type: 'Bearer',
      scope: 'openid profile email',
      audience: 'https://api.tenon.ai',
    },
    accessToken: options.accessToken,
    internal: {
      sid: `qa-sid-${options.roles.join('-') || 'none'}`,
      createdAt: now,
    },
  };
}

function resolveDevIdentity(roles: string[]) {
  const recruiterEmail =
    process.env.QA_E2E_RECRUITER_EMAIL?.trim().toLowerCase() ||
    'recruiter1@local.test';
  const candidateEmail =
    process.env.QA_E2E_CANDIDATE_EMAIL?.trim().toLowerCase() ||
    'candidate1@local.test';

  const normalizedRoles = new Set(roles.map((role) => role.toLowerCase()));
  if (normalizedRoles.has('candidate') && !normalizedRoles.has('recruiter')) {
    return {
      email: candidateEmail,
      accessToken: `candidate:${candidateEmail}`,
      sub: `candidate:${candidateEmail}`,
    };
  }

  return {
    email: recruiterEmail,
    accessToken: `recruiter:${recruiterEmail}`,
    sub: `recruiter:${recruiterEmail}`,
  };
}

function resolveBaseURL(config: FullConfig): string {
  const fromProject = config.projects.find((project) => project.name === 'chromium')?.use
    .baseURL;
  if (typeof fromProject === 'string' && fromProject.trim()) return fromProject;

  const fromUse = config.use?.baseURL;
  if (typeof fromUse === 'string' && fromUse.trim()) return fromUse;

  return process.env.QA_E2E_BASE_URL ?? 'http://127.0.0.1:3200';
}

function resolveStorageDir(repoRoot: string): string {
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

export default async function globalSetup(config: FullConfig) {
  const repoRoot = path.resolve(__dirname, '..', '..', '..');
  const envMap = await loadEnvMap(repoRoot);

  const secret = readEnv('TENON_AUTH0_SECRET', envMap);
  if (!secret) {
    throw new Error(
      'TENON_AUTH0_SECRET is required to generate QA Playwright auth storage states.',
    );
  }

  const claimNamespace = resolveClaimNamespace(envMap);
  const baseURL = resolveBaseURL(config);
  const storageDir = resolveStorageDir(repoRoot);

  const presets: RolePreset[] = [
    {
      fileName: 'authenticated.json',
      permissions: ['recruiter:access', 'candidate:access'],
      roles: ['recruiter', 'candidate'],
    },
    {
      fileName: 'recruiter-only.json',
      permissions: ['recruiter:access'],
      roles: ['recruiter'],
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
