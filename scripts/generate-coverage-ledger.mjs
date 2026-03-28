import fs from 'node:fs';
import path from 'node:path';
import {
  areaFor,
  collectSourceFiles,
  coverageEntry,
  findTestsForPath,
  statusForCoverage,
} from './generate-coverage-ledger.helpers.mjs';

const root = process.cwd();
const coveragePath = path.join(root, 'coverage', 'coverage-summary.json');
const coverage = fs.existsSync(coveragePath)
  ? JSON.parse(fs.readFileSync(coveragePath, 'utf8'))
  : {};

const rows = collectSourceFiles(root, 'src');

const ledgerLines = [];
ledgerLines.push('# Coverage Ledger');
ledgerLines.push('');
ledgerLines.push(
  'Auto-generated from coverage/coverage-summary.json. Each row lists path, area, status, detected tests (up to 3), and notes. Update by running `node scripts/generate-coverage-ledger.mjs` after a coverage run.',
);
ledgerLines.push('');
ledgerLines.push('| Path | Area | Status | Tests | Notes |');
ledgerLines.push('| --- | --- | --- | --- | --- |');

rows.forEach((absPath) => {
  const rel = path.relative(root, absPath);
  const entry = coverageEntry(root, coverage, rel);
  const detectedTests = findTestsForPath(rel);
  const note = path.extname(rel) === '.css' ? 'style asset' : '';
  ledgerLines.push(
    `| ${rel} | ${areaFor(rel)} | ${statusForCoverage(entry)} | ${
      detectedTests.length ? detectedTests.join('<br>') : '—'
    } | ${note || ''} |`,
  );
});

fs.writeFileSync(
  path.join(root, 'docs', 'COVERAGE_LEDGER.md'),
  ledgerLines.join('\n'),
);

console.log('Wrote docs/COVERAGE_LEDGER.md with', rows.length, 'entries');
