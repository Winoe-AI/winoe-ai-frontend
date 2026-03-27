export function validateCriticalMutations(entries, failures, hasSpecFile, failRegex) {
  for (const entry of entries) {
    const name = entry?.name;
    const endpoint = entry?.endpoint;
    if (typeof name !== 'string' || name.trim().length === 0) {
      failures.push('criticalMutations: each item must have a non-empty name.');
    }
    if (typeof endpoint !== 'string' || !endpoint.startsWith('/api/')) {
      failures.push(`criticalMutations ${String(name)}: endpoint must start with /api/.`);
    }
    if (!Array.isArray(entry.specs) || entry.specs.length === 0) {
      failures.push(`criticalMutations ${String(name)}: specs must be non-empty.`);
    } else {
      for (const spec of entry.specs) {
        if (!hasSpecFile(spec)) {
          failures.push(`criticalMutations ${String(name)}: missing spec file tests/e2e/flow-qa/${String(spec)}.`);
        }
      }
    }
    if (!Array.isArray(entry.assertions) || entry.assertions.length === 0) {
      failures.push(`criticalMutations ${String(name)}: assertions must be non-empty.`);
      continue;
    }

    const hasSuccess = entry.assertions.some((item) => /^success$/i.test(String(item)));
    const hasFailure = entry.assertions.some((item) => failRegex.test(String(item)));
    if (!hasSuccess) {
      failures.push(`criticalMutations ${String(name)}: assertions must include 'success'.`);
    }
    if (!hasFailure) {
      failures.push(`criticalMutations ${String(name)}: assertions must include a failure-mode assertion (error/validation/timeout/etc).`);
    }
  }
}
