import fs from 'node:fs';
import path from 'node:path';

export function walkFiles(startDir) {
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

export function normalizeRouteFromAppPage(repoRoot, absPath) {
  const rel = path.relative(path.join(repoRoot, 'src', 'app'), absPath);
  const routeish = rel.replace(/\\/g, '/').replace(/\/page\.tsx$/, '');
  const segments = routeish.split('/').filter(Boolean);
  const clean = segments.filter(
    (segment) => !(segment.startsWith('(') && segment.endsWith(')')),
  );
  return clean.length === 0 ? '/' : `/${clean.join('/')}`;
}

export function dedupeSort(items) {
  return [...new Set(items)].sort((a, b) => a.localeCompare(b));
}
