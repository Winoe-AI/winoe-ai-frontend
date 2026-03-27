export function validateManifestShape(manifest, failures) {
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

export function validateRouteEntries(entries, label, failures, hasSpecFile) {
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
        if (!hasSpecFile(spec)) {
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
