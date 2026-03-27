import fs from 'node:fs';

export function parseArgs(argv) {
  const parsed = {
    file: '',
    label: 'suite',
    maxUnexpected: 0,
    maxFlaky: 0,
    maxSkipped: 0,
    output: '',
  };

  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const next = argv[i + 1];
    switch (key) {
      case '--file':
        parsed.file = next ?? '';
        i += 1;
        break;
      case '--label':
        parsed.label = next ?? parsed.label;
        i += 1;
        break;
      case '--max-unexpected':
        parsed.maxUnexpected = Number(next ?? parsed.maxUnexpected);
        i += 1;
        break;
      case '--max-flaky':
        parsed.maxFlaky = Number(next ?? parsed.maxFlaky);
        i += 1;
        break;
      case '--max-skipped':
        parsed.maxSkipped = Number(next ?? parsed.maxSkipped);
        i += 1;
        break;
      case '--output':
        parsed.output = next ?? '';
        i += 1;
        break;
      default:
        throw new Error(`Unknown option: ${key}`);
    }
  }

  if (!parsed.file) throw new Error('Missing required --file <path> argument.');
  return parsed;
}

export function readStats(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Results file not found: ${filePath}`);

  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const stats = raw?.stats ?? {};
  const summary = {
    expected: Number(stats.expected ?? 0),
    skipped: Number(stats.skipped ?? 0),
    unexpected: Number(stats.unexpected ?? 0),
    flaky: Number(stats.flaky ?? 0),
    durationMs: Number(stats.duration ?? 0),
  };

  if ([summary.expected, summary.skipped, summary.unexpected, summary.flaky].some(Number.isNaN)) {
    throw new Error(`Invalid Playwright stats payload in ${filePath}`);
  }
  return summary;
}
