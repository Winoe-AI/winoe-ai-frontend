#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');
const manifestPath = path.join(
  repoRoot,
  'tests',
  'e2e',
  'flow-qa',
  'coverage-manifest.json',
);
const appDir = path.join(repoRoot, 'src', 'app');
const specDir = path.join(repoRoot, 'tests', 'e2e', 'flow-qa');
const summaryPath = process.env.FLOW_QA_CONTRACT_SUMMARY_PATH?.trim()
  ? path.resolve(process.env.FLOW_QA_CONTRACT_SUMMARY_PATH)
  : null;

const failRegex =
  /(fail|error|forbidden|unauthorized|validation|timeout|empty|rejected|cooldown)/i;

function walkFiles(startDir) {
  const stack = [startDir];
  const files = [];
  while (stack.length > 0) {
    const dir = stack.pop();
    if (!dir) continue;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(abs);
        continue;
      }
      if (entry.isFile()) files.push(abs);
    }
  }
  return files;
}

function normalizeRouteFromAppPage(absPath) {
  const rel = path.relative(path.join(repoRoot, 'src', 'app'), absPath);
  const routeish = rel.replace(/\\/g, '/').replace(/\/page\.tsx$/, '');
  const segments = routeish.split('/').filter(Boolean);
  const clean = segments.filter(
    (segment) => !(segment.startsWith('(') && segment.endsWith(')')),
  );
  return clean.length === 0 ? '/' : `/${clean.join('/')}`;
}

function dedupeSort(items) {
  return [...new Set(items)].sort((a, b) => a.localeCompare(b));
}

function fileExistsUnderSpecDir(specName) {
  const abs = path.join(specDir, specName);
  return fs.existsSync(abs) && fs.statSync(abs).isFile();
}

function validateManifestShape(manifest, failures) {
  if (!manifest || typeof manifest !== 'object') {
    failures.push('coverage-manifest.json must be a JSON object.');
    return;
  }
  if (!Array.isArray(manifest.pageRoutes)) {
    failures.push('coverage-manifest.json: pageRoutes must be an array.');
  }
  if (!Array.isArray(manifest.nonPageRoutes)) {
    failures.push('coverage-manifest.json: nonPageRoutes must be an array.');
  }
  if (!Array.isArray(manifest.criticalMutations)) {
    failures.push(
      'coverage-manifest.json: criticalMutations must be an array.',
    );
  }
}

function validateRouteEntries(entries, label, failures) {
  for (const entry of entries) {
    const route = entry?.route;
    if (typeof route !== 'string' || !route.startsWith('/')) {
      failures.push(
        `${label}: every entry.route must be an absolute route (starts with /).`,
      );
      continue;
    }
    if (!Array.isArray(entry.specs) || entry.specs.length === 0) {
      failures.push(`${label} ${route}: specs must be a non-empty array.`);
    } else {
      for (const spec of entry.specs) {
        if (typeof spec !== 'string' || !spec.endsWith('.spec.ts')) {
          failures.push(
            `${label} ${route}: invalid spec name '${String(spec)}'.`,
          );
          continue;
        }
        if (!fileExistsUnderSpecDir(spec)) {
          failures.push(
            `${label} ${route}: missing spec file tests/e2e/flow-qa/${spec}.`,
          );
        }
      }
    }
    if (!Array.isArray(entry.states) || entry.states.length === 0) {
      failures.push(`${label} ${route}: states must be a non-empty array.`);
    }
  }
}

function validateCriticalMutations(entries, failures) {
  for (const entry of entries) {
    const name = entry?.name;
    const endpoint = entry?.endpoint;
    if (typeof name !== 'string' || name.trim().length === 0) {
      failures.push('criticalMutations: each item must have a non-empty name.');
    }
    if (typeof endpoint !== 'string' || !endpoint.startsWith('/api/')) {
      failures.push(
        `criticalMutations ${String(name)}: endpoint must start with /api/.`,
      );
    }
    if (!Array.isArray(entry.specs) || entry.specs.length === 0) {
      failures.push(
        `criticalMutations ${String(name)}: specs must be non-empty.`,
      );
    } else {
      for (const spec of entry.specs) {
        if (!fileExistsUnderSpecDir(spec)) {
          failures.push(
            `criticalMutations ${String(name)}: missing spec file tests/e2e/flow-qa/${String(spec)}.`,
          );
        }
      }
    }
    if (!Array.isArray(entry.assertions) || entry.assertions.length === 0) {
      failures.push(
        `criticalMutations ${String(name)}: assertions must be non-empty.`,
      );
      continue;
    }
    const hasSuccess = entry.assertions.some((item) =>
      /^success$/i.test(String(item)),
    );
    const hasFailure = entry.assertions.some((item) =>
      failRegex.test(String(item)),
    );
    if (!hasSuccess) {
      failures.push(
        `criticalMutations ${String(name)}: assertions must include 'success'.`,
      );
    }
    if (!hasFailure) {
      failures.push(
        `criticalMutations ${String(name)}: assertions must include a failure-mode assertion (error/validation/timeout/etc).`,
      );
    }
  }
}

function main() {
  const failures = [];

  if (!fs.existsSync(manifestPath)) {
    console.error(`Missing manifest: ${manifestPath}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  validateManifestShape(manifest, failures);

  const pageRoutes = Array.isArray(manifest.pageRoutes)
    ? manifest.pageRoutes
    : [];
  const nonPageRoutes = Array.isArray(manifest.nonPageRoutes)
    ? manifest.nonPageRoutes
    : [];
  const criticalMutations = Array.isArray(manifest.criticalMutations)
    ? manifest.criticalMutations
    : [];

  validateRouteEntries(pageRoutes, 'pageRoutes', failures);
  validateRouteEntries(nonPageRoutes, 'nonPageRoutes', failures);
  validateCriticalMutations(criticalMutations, failures);

  const appPageRoutes = dedupeSort(
    walkFiles(appDir)
      .filter((abs) => abs.endsWith(`${path.sep}page.tsx`))
      .map((abs) => normalizeRouteFromAppPage(abs)),
  );

  const manifestPageRoutes = dedupeSort(
    pageRoutes
      .map((entry) => entry?.route)
      .filter((route) => typeof route === 'string'),
  );

  const missingFromManifest = appPageRoutes.filter(
    (route) => !manifestPageRoutes.includes(route),
  );
  const staleInManifest = manifestPageRoutes.filter(
    (route) => !appPageRoutes.includes(route),
  );

  if (missingFromManifest.length > 0) {
    failures.push(
      `Missing page route coverage entries: ${missingFromManifest.join(', ')}`,
    );
  }
  if (staleInManifest.length > 0) {
    failures.push(
      `Stale page route coverage entries (route removed or renamed): ${staleInManifest.join(', ')}`,
    );
  }

  const summary = {
    contractVersion: manifest.contractVersion ?? null,
    appPageRouteCount: appPageRoutes.length,
    manifestPageRouteCount: manifestPageRoutes.length,
    missingFromManifest,
    staleInManifest,
    pageRoutesValidated: pageRoutes.length,
    nonPageRoutesValidated: nonPageRoutes.length,
    criticalMutationsValidated: criticalMutations.length,
    failureCount: failures.length,
    failures,
  };

  if (summaryPath) {
    fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
    fs.writeFileSync(
      summaryPath,
      `${JSON.stringify(summary, null, 2)}\n`,
      'utf8',
    );
  }

  if (failures.length > 0) {
    console.error('Flow QA contract validation failed:');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log(
    `Flow QA contract validation passed (${summary.appPageRouteCount} page routes, ${summary.criticalMutationsValidated} critical mutations).`,
  );
}

main();
