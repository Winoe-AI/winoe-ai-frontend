#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
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

  if (!parsed.file) {
    throw new Error('Missing required --file <path> argument.');
  }
  return parsed;
}

function readStats(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Results file not found: ${filePath}`);
  }

  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const stats = raw?.stats ?? {};
  const summary = {
    expected: Number(stats.expected ?? 0),
    skipped: Number(stats.skipped ?? 0),
    unexpected: Number(stats.unexpected ?? 0),
    flaky: Number(stats.flaky ?? 0),
    durationMs: Number(stats.duration ?? 0),
  };

  if (
    Number.isNaN(summary.expected) ||
    Number.isNaN(summary.skipped) ||
    Number.isNaN(summary.unexpected) ||
    Number.isNaN(summary.flaky)
  ) {
    throw new Error(`Invalid Playwright stats payload in ${filePath}`);
  }

  return summary;
}

function main() {
  const args = parseArgs(process.argv);
  const absFile = path.resolve(args.file);
  const summary = readStats(absFile);

  const failures = [];
  if (summary.unexpected > args.maxUnexpected) {
    failures.push(
      `${args.label}: unexpected failures ${summary.unexpected} exceeds max ${args.maxUnexpected}`,
    );
  }
  if (summary.flaky > args.maxFlaky) {
    failures.push(`${args.label}: flaky tests ${summary.flaky} exceeds max ${args.maxFlaky}`);
  }
  if (summary.skipped > args.maxSkipped) {
    failures.push(
      `${args.label}: skipped tests ${summary.skipped} exceeds max ${args.maxSkipped}`,
    );
  }

  const payload = {
    label: args.label,
    file: absFile,
    thresholds: {
      maxUnexpected: args.maxUnexpected,
      maxFlaky: args.maxFlaky,
      maxSkipped: args.maxSkipped,
    },
    summary,
    failures,
    ok: failures.length === 0,
  };

  if (args.output) {
    const absOutput = path.resolve(args.output);
    fs.mkdirSync(path.dirname(absOutput), { recursive: true });
    fs.writeFileSync(absOutput, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  }

  if (payload.ok) {
    console.log(
      `${args.label}: pass (expected=${summary.expected}, skipped=${summary.skipped}, flaky=${summary.flaky}, unexpected=${summary.unexpected})`,
    );
    return;
  }

  console.error(`${args.label}: quality gate failed`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

main();
