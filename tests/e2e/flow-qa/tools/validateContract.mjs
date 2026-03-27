#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dedupeSort, normalizeRouteFromAppPage, walkFiles } from './validateContract.utils.mjs';
import { validateManifestShape, validateRouteEntries } from './validateContract.routes.mjs';
import { validateCriticalMutations } from './validateContract.mutations.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');
const manifestPath = path.join(repoRoot, 'tests', 'e2e', 'flow-qa', 'coverage-manifest.json');
const appDir = path.join(repoRoot, 'src', 'app');
const specDir = path.join(repoRoot, 'tests', 'e2e', 'flow-qa');
const summaryPath = process.env.FLOW_QA_CONTRACT_SUMMARY_PATH?.trim()
  ? path.resolve(process.env.FLOW_QA_CONTRACT_SUMMARY_PATH)
  : null;
const failRegex = /(fail|error|forbidden|unauthorized|validation|timeout|empty|rejected|cooldown)/i;

function hasSpecFile(specName) {
  const abs = path.join(specDir, specName);
  return fs.existsSync(abs) && fs.statSync(abs).isFile();
}

function main() {
  const failures = [];
  if (!fs.existsSync(manifestPath)) {
    console.error(`Missing manifest: ${manifestPath}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  validateManifestShape(manifest, failures);

  const pageRoutes = Array.isArray(manifest.pageRoutes) ? manifest.pageRoutes : [];
  const nonPageRoutes = Array.isArray(manifest.nonPageRoutes) ? manifest.nonPageRoutes : [];
  const criticalMutations = Array.isArray(manifest.criticalMutations) ? manifest.criticalMutations : [];
  validateRouteEntries(pageRoutes, 'pageRoutes', failures, hasSpecFile);
  validateRouteEntries(nonPageRoutes, 'nonPageRoutes', failures, hasSpecFile);
  validateCriticalMutations(criticalMutations, failures, hasSpecFile, failRegex);

  const appPageRoutes = dedupeSort(
    walkFiles(appDir)
      .filter((abs) => abs.endsWith(`${path.sep}page.tsx`))
      .map((abs) => normalizeRouteFromAppPage(repoRoot, abs)),
  );
  const manifestPageRoutes = dedupeSort(pageRoutes.map((entry) => entry?.route).filter((route) => typeof route === 'string'));
  const missingFromManifest = appPageRoutes.filter((route) => !manifestPageRoutes.includes(route));
  const staleInManifest = manifestPageRoutes.filter((route) => !appPageRoutes.includes(route));
  if (missingFromManifest.length > 0) failures.push(`Missing page route coverage entries: ${missingFromManifest.join(', ')}`);
  if (staleInManifest.length > 0) failures.push(`Stale page route coverage entries (route removed or renamed): ${staleInManifest.join(', ')}`);

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
    fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  }

  if (failures.length > 0) {
    console.error('Flow QA contract validation failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  console.log(`Flow QA contract validation passed (${summary.appPageRouteCount} page routes, ${summary.criticalMutationsValidated} critical mutations).`);
}

main();
