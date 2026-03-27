#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, readStats } from './checkPlaywrightResults.lib.mjs';

function main() {
  const args = parseArgs(process.argv);
  const absFile = path.resolve(args.file);
  const summary = readStats(absFile);

  const failures = [];
  if (summary.unexpected > args.maxUnexpected) {
    failures.push(`${args.label}: unexpected failures ${summary.unexpected} exceeds max ${args.maxUnexpected}`);
  }
  if (summary.flaky > args.maxFlaky) {
    failures.push(`${args.label}: flaky tests ${summary.flaky} exceeds max ${args.maxFlaky}`);
  }
  if (summary.skipped > args.maxSkipped) {
    failures.push(`${args.label}: skipped tests ${summary.skipped} exceeds max ${args.maxSkipped}`);
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
    console.log(`${args.label}: pass (expected=${summary.expected}, skipped=${summary.skipped}, flaky=${summary.flaky}, unexpected=${summary.unexpected})`);
    return;
  }

  console.error(`${args.label}: quality gate failed`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

main();
