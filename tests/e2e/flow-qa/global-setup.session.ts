import fs from 'fs/promises';
import path from 'path';

export function toStorageStateCookie(options: {
  value: string;
  baseURL: string;
}) {
  const target = new URL(options.baseURL);
  return {
    name: '__session',
    value: options.value,
    domain: target.hostname,
    path: '/',
    httpOnly: true,
    secure: target.protocol === 'https:',
    sameSite: 'Lax' as const,
    expires: Math.floor(Date.now() / 1000) + 3600,
  };
}

export async function writeStorageState(
  filePath: string,
  cookie: ReturnType<typeof toStorageStateCookie>,
) {
  const payload = { cookies: [cookie], origins: [] };
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');
}

export function buildSession(options: {
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
      audience: 'https://api.winoe.ai',
    },
    accessToken: options.accessToken,
    internal: {
      sid: `qa-sid-${options.roles.join('-') || 'none'}`,
      createdAt: now,
    },
  };
}

export function resolveDevIdentity(roles: string[]) {
  const talentPartnerEmail =
    process.env.QA_E2E_TALENT_PARTNER_EMAIL?.trim().toLowerCase() ||
    'talent_partner1@local.test';
  const candidateEmail =
    process.env.QA_E2E_CANDIDATE_EMAIL?.trim().toLowerCase() ||
    'candidate1@local.test';

  const normalizedRoles = new Set(roles.map((role) => role.toLowerCase()));
  if (
    normalizedRoles.has('candidate') &&
    !normalizedRoles.has('talent_partner')
  ) {
    return {
      email: candidateEmail,
      accessToken: `candidate:${candidateEmail}`,
      sub: `candidate:${candidateEmail}`,
    };
  }
  return {
    email: talentPartnerEmail,
    accessToken: `talent_partner:${talentPartnerEmail}`,
    sub: `talent_partner:${talentPartnerEmail}`,
  };
}
