import fs from 'fs/promises';
import path from 'path';

export type EnvMap = Record<string, string>;

export function parseEnvFile(content: string): EnvMap {
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
    } else {
      const commentIndex = value.search(/\s+#/);
      if (commentIndex >= 0) {
        value = value.slice(0, commentIndex).trimEnd();
      }
    }
    result[key] = value;
  }
  return result;
}

export async function loadEnvMap(repoRoot: string): Promise<EnvMap> {
  const envPath = path.join(repoRoot, '.env.local');
  try {
    const content = await fs.readFile(envPath, 'utf8');
    return parseEnvFile(content);
  } catch {
    return {};
  }
}

export function readEnv(key: string, map: EnvMap): string | null {
  const value = process.env[key] ?? map[key];
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveClaimNamespace(map: EnvMap): string {
  const raw = readEnv('NEXT_PUBLIC_WINOE_AUTH0_CLAIM_NAMESPACE', map);
  const base = raw ?? 'https://winoe.ai';
  return base.endsWith('/') ? base : `${base}/`;
}
