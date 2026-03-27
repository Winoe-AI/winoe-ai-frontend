import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

export function collectSourceFiles(root, sourceDir = 'src') {
  const rows = [];
  const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === '.DS_Store') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else rows.push(full);
    }
  };
  walk(path.join(root, sourceDir));
  return rows.sort();
}

export function areaFor(rel) {
  if (rel.includes('/app/(candidate)')) return 'candidate routes';
  if (rel.includes('/app/(recruiter)')) return 'recruiter routes';
  if (rel.includes('/app/(auth)')) return 'auth routes';
  if (rel.includes('/app/(marketing)')) return 'marketing';
  if (rel.includes('/app/api/')) return 'api route';
  if (rel.includes('/app/')) return 'app route/layout';
  if (rel.includes('/features/candidate/')) return 'candidate feature';
  if (rel.includes('/features/recruiter/')) return 'recruiter feature';
  if (rel.includes('/shared/ui/')) return 'ui components';
  if (rel.includes('/shared/')) return 'shared feature';
  if (rel.includes('/features/auth/')) return 'auth feature';
  if (rel.includes('/features/marketing/')) return 'marketing feature';
  if (rel.includes('/components/')) return 'ui components';
  if (rel.includes('/lib/server/')) return 'server utilities';
  if (rel.includes('/lib/api/')) return 'api client';
  if (rel.includes('/lib/')) return 'lib';
  if (rel.includes('/types/')) return 'types';
  return 'misc';
}

export function coverageEntry(root, coverage, rel) {
  const abs = path.join(root, rel);
  return coverage[abs] ?? coverage[rel];
}

export function statusForCoverage(entry) {
  if (!entry) return 'not instrumented';
  const { statements, branches, functions, lines } = entry;
  const all99 = [statements, branches, functions, lines]
    .map((s) => s?.pct === 99)
    .every(Boolean);
  if (all99) return 'covered (99%)';
  return `needs tests (S ${statements?.pct ?? 0} / B ${branches?.pct ?? 0} / F ${functions?.pct ?? 0} / L ${lines?.pct ?? 0})`;
}

export function findTestsForPath(rel) {
  const withoutSrc = rel.replace(/^src\//, '');
  const aliasPattern = `@/${withoutSrc.replace(/\\/g, '/')}`.replace(
    /\\/g,
    '/',
  );
  const base = path.basename(rel, path.extname(rel));
  const patterns = [aliasPattern.replace(/\.[^.]+$/, ''), base];
  const results = new Set();

  for (const pattern of patterns) {
    if (!pattern || pattern === 'index') continue;
    try {
      const out = execSync(
        `rg --files-with-matches --glob "*.test.*" "${pattern.replace(/"/g, '\\"')}" tests`,
        { encoding: 'utf8' },
      );
      out
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach((line) => results.add(line));
    } catch {
      // no match
    }
    if (results.size >= 3) break;
  }
  return Array.from(results).slice(0, 3);
}
