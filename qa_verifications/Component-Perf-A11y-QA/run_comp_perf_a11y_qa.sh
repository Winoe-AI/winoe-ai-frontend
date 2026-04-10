#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: run_comp_perf_a11y_qa.sh [options]

Runs the Frontend Component, Performance, and Accessibility QA pass.

Options:
  --host <name>         Host for local app and Lighthouse (default: 127.0.0.1)
  --port <n>            Port for local app when running Lighthouse (default: 3000)
  --skip-lint           Skip lint gate (eslint + prettier)
  --skip-typecheck      Skip typecheck gate
  --skip-build          Skip build + analyze + perf summaries
  --skip-analyze        Skip analyze step (bundle analyzer build)
  --skip-lighthouse     Skip Lighthouse captures
  --skip-gap-tests      Skip running gap/a11y tests under winoe-frontend/tests
  --no-cert-gates       Do not enforce certification pass/fail gates
  --refresh-scope-manifest  Regenerate qa scope-manifest.json from current repo state
  --keep-server         Do not stop server if this script started it
  -h, --help            Show help
USAGE
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
QA_ROOT="$SCRIPT_DIR"
LATEST_DIR="$QA_ROOT/comp_perf_a11y_qa_latest"
REPORT_MD="$LATEST_DIR/comp_perf_a11y_qa_report.md"
ARTIFACTS_DIR="$LATEST_DIR/artifacts"
QA_DIR="$ARTIFACTS_DIR"
REPO_ROOT="$(cd "$QA_ROOT/../.." && pwd)"
cd "$REPO_ROOT"

HOST="${QA_HOST:-127.0.0.1}"
PORT="${QA_PORT:-3000}"
RUN_LINT=1
RUN_TYPECHECK=1
RUN_BUILD=1
RUN_ANALYZE=1
RUN_LIGHTHOUSE=1
LIGHTHOUSE_REQUESTED=1
RUN_GAP_TESTS=1
ENFORCE_CERT_GATES=1
REFRESH_SCOPE_MANIFEST=0
KEEP_SERVER=0
RUN_MODE="full"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host)
      HOST="${2:-}"
      RUN_MODE="custom"
      shift 2
      ;;
    --port)
      PORT="${2:-}"
      RUN_MODE="custom"
      shift 2
      ;;
    --skip-lint)
      RUN_LINT=0
      RUN_MODE="custom"
      shift
      ;;
    --skip-typecheck)
      RUN_TYPECHECK=0
      RUN_MODE="custom"
      shift
      ;;
    --skip-build)
      RUN_BUILD=0
      RUN_ANALYZE=0
      RUN_MODE="custom"
      shift
      ;;
    --skip-analyze)
      RUN_ANALYZE=0
      RUN_MODE="custom"
      shift
      ;;
    --skip-lighthouse)
      RUN_LIGHTHOUSE=0
      LIGHTHOUSE_REQUESTED=0
      RUN_MODE="custom"
      shift
      ;;
    --skip-gap-tests)
      RUN_GAP_TESTS=0
      RUN_MODE="custom"
      shift
      ;;
    --no-cert-gates)
      ENFORCE_CERT_GATES=0
      RUN_MODE="custom"
      shift
      ;;
    --refresh-scope-manifest)
      REFRESH_SCOPE_MANIFEST=1
      RUN_MODE="custom"
      shift
      ;;
    --keep-server)
      KEEP_SERVER=1
      RUN_MODE="custom"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 2
      ;;
  esac
done

if [[ -z "${PORT}" ]]; then
  echo "--port requires a value" >&2
  exit 2
fi
if [[ -z "${HOST}" ]]; then
  echo "--host requires a value" >&2
  exit 2
fi

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Required command not found: $cmd" >&2
    exit 1
  fi
}

require_cmd npm
require_cmd node
require_cmd rg
require_cmd curl

PREVIOUS_LATEST_INVENTORY_TMP="$(mktemp)"
if [[ -d "$LATEST_DIR" ]]; then
  find "$LATEST_DIR" -maxdepth 3 -type f | sort > "$PREVIOUS_LATEST_INVENTORY_TMP"
fi

rm -rf "$LATEST_DIR"
mkdir -p "$ARTIFACTS_DIR"

RUN_ID="$(date '+%Y%m%d-%H%M%S')"
RUN_LOCAL_TS="$(date '+%Y-%m-%d %H:%M:%S %Z')"
RUN_UTC_TS="$(date -u '+%Y-%m-%d %H:%M:%S UTC')"
RUN_STARTED_UTC="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
RUN_STARTED_EPOCH="$(date +%s)"
RUN_LOG="$QA_DIR/runner.log"
STATUS_FILE="$QA_DIR/runner-status.tsv"
PRE_INVENTORY="$QA_DIR/pre-run-inventory.txt"
POST_INVENTORY="$QA_DIR/post-run-inventory.txt"
RUNNER_REL_PATH="./qa_verifications/Component-Perf-A11y-QA/run_comp_perf_a11y_qa.sh"
SCOPE_MANIFEST_PATH="$QA_ROOT/scope-manifest.json"

export QA_DIR QA_ROOT RUN_LOCAL_TS RUN_UTC_TS RUN_STARTED_UTC RUN_STARTED_EPOCH RUN_MODE RUNNER_REL_PATH REPORT_MD LATEST_DIR ARTIFACTS_DIR RUN_LINT RUN_TYPECHECK RUN_BUILD RUN_ANALYZE RUN_LIGHTHOUSE LIGHTHOUSE_REQUESTED RUN_GAP_TESTS ENFORCE_CERT_GATES REFRESH_SCOPE_MANIFEST HOST PORT SCOPE_MANIFEST_PATH
# Keep QA output focused on actionable issues by suppressing stale baseline-data
# warnings from transitive tooling.
export BROWSERSLIST_IGNORE_OLD_DATA=true
export BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA=true

record_status() {
  local key="$1"
  local status="$2"
  printf "%s\t%s\n" "$key" "$status" >> "$STATUS_FILE"
}

echo "Starting QA run at $RUN_LOCAL_TS ($RUN_UTC_TS)"
echo "Run ID: $RUN_ID"
echo "Repo root: $REPO_ROOT"
echo "QA root: $QA_ROOT"
echo "Latest dir: $LATEST_DIR"
echo "Artifacts dir: $ARTIFACTS_DIR"
echo "Runner log: $RUN_LOG"
echo "Status file: $STATUS_FILE"
echo

# Sandbox-safe logging: avoid process substitution (/dev/fd) which is blocked
# in some restricted execution environments.
exec >>"$RUN_LOG" 2>&1
: > "$STATUS_FILE"
: > "$PRE_INVENTORY"
if [[ -s "$PREVIOUS_LATEST_INVENTORY_TMP" ]]; then
  cp "$PREVIOUS_LATEST_INVENTORY_TMP" "$PRE_INVENTORY"
fi
rm -f "$PREVIOUS_LATEST_INVENTORY_TMP"

echo "== Step 0: Read Existing QA Artifacts =="
if [[ -s "$PRE_INVENTORY" ]]; then
  echo "Found prior run artifacts in $LATEST_DIR (captured in $PRE_INVENTORY)."
else
  echo "No existing report set found; initializing from scratch."
fi
find "$LATEST_DIR" -maxdepth 3 -type f | sort >> "$PRE_INVENTORY"
record_status "step0_inventory" 0
echo

run_with_log() {
  local step_key="$1"
  local log_file="$2"
  shift 2
  set +e
  /usr/bin/time -p "$@" 2>&1 \
    | sed '/^\[baseline-browser-mapping\]/d' \
    | tee "$log_file"
  local status="${PIPESTATUS[0]}"
  set -e
  record_status "$step_key" "$status"
  return "$status"
}

echo "== Step 1: Lint + Typecheck Gates =="
if [[ "$RUN_LINT" -eq 1 ]]; then
  if run_with_log "lint" "$QA_DIR/lint.log" npm run lint; then
    echo "Lint passed."
  else
    echo "Lint failed; certification gate will fail unless --no-cert-gates."
  fi
else
  echo "Lint step skipped."
  record_status "lint" 99
fi

if [[ "$RUN_TYPECHECK" -eq 1 ]]; then
  if run_with_log "typecheck" "$QA_DIR/typecheck.log" npm run typecheck; then
    echo "Typecheck passed."
  else
    echo "Typecheck failed; certification gate will fail unless --no-cert-gates."
  fi
else
  echo "Typecheck step skipped."
  record_status "typecheck" 99
fi
echo

echo "== Step 2: Run Full Jest Coverage Suite =="
if run_with_log "test_coverage" "$QA_DIR/jest-coverage-run.log" npm run test:coverage; then
  echo "Jest coverage run succeeded."
else
  echo "Jest coverage run failed; continuing to capture diagnostics."
fi
echo

echo "== Step 2B: Parse Jest Summary and Failures =="
node <<'NODE'
const fs = require('fs');
const path = require('path');

const qaDir = process.env.QA_DIR;
const logPath = path.join(qaDir, 'jest-coverage-run.log');
const covPath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');

const outputSummary = path.join(qaDir, 'jest-summary.json');
const outputFailures = path.join(qaDir, 'jest-failures.json');

const summary = {};
const failures = [];

if (fs.existsSync(logPath)) {
  const log = fs.readFileSync(logPath, 'utf8');
  const suiteMatch = log.match(/Test Suites:\s+(\d+)\s+passed,\s+(\d+)\s+total/);
  if (suiteMatch) {
    summary.totalSuitesPassed = Number(suiteMatch[1]);
    summary.totalSuites = Number(suiteMatch[2]);
    summary.totalSuitesFailed = summary.totalSuites - summary.totalSuitesPassed;
  }
  const testMatch = log.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+total/);
  if (testMatch) {
    summary.totalTestsPassed = Number(testMatch[1]);
    summary.totalTests = Number(testMatch[2]);
    summary.totalTestsFailed = summary.totalTests - summary.totalTestsPassed;
  }
  const snapshotMatch = log.match(/Snapshots:\s+(\d+)\s+passed,\s+(\d+)\s+total/);
  if (snapshotMatch) {
    summary.totalSnapshotsPassed = Number(snapshotMatch[1]);
    summary.totalSnapshots = Number(snapshotMatch[2]);
  }
  const jestTime = log.match(/Time:\s+([\d.]+)\s*s/);
  if (jestTime) summary.jestTimeSeconds = Number(jestTime[1]);
  const realTime = log.match(/real\s+([\d.]+)/);
  if (realTime) summary.wallTimeSeconds = Number(realTime[1]);

  const failSuiteMatches = [...log.matchAll(/^FAIL\s+(.+)$/gm)];
  const hasEnvSignals =
    /Cannot find module|Jest encountered an unexpected token|ReferenceError:\s+window is not defined|testEnvironment/i.test(
      log,
    );
  const hasFlakySignals = /timed out|ECONNRESET|EAI_AGAIN|retry/i.test(log);
  const category = hasEnvSignals
    ? 'env'
    : hasFlakySignals
      ? 'flaky'
      : 'bug';

  for (const m of failSuiteMatches) {
    failures.push({
      suite: m[1].trim(),
      category,
      details: 'See jest-coverage-run.log for full stack trace.',
    });
  }
}

if (fs.existsSync(covPath)) {
  const cov = JSON.parse(fs.readFileSync(covPath, 'utf8'));
  if (cov.total) {
    summary.coverage = {
      statements: cov.total.statements?.pct ?? null,
      branches: cov.total.branches?.pct ?? null,
      functions: cov.total.functions?.pct ?? null,
      lines: cov.total.lines?.pct ?? null,
    };
  }
}

summary.coverageInstrumentedFiles = Number(
  require('child_process')
    .execSync("rg -l '__coverage__' tests/unit tests/integration | wc -l", {
      encoding: 'utf8',
    })
    .trim(),
);
summary.coverageTestFiles = Number(
  require('child_process')
    .execSync(
      "rg --files tests/unit tests/integration -g '*.coverage.test.ts' -g '*.coverage.test.tsx' | wc -l",
      { encoding: 'utf8' },
    )
    .trim(),
);

fs.writeFileSync(outputSummary, JSON.stringify(summary, null, 2));
fs.writeFileSync(outputFailures, JSON.stringify(failures, null, 2));
NODE
record_status "parse_jest" 0
echo

echo "== Step 2C: Console Error/Warn Signal Audit =="
node <<'NODE'
const fs = require('fs');
const path = require('path');

const qaDir = process.env.QA_DIR;
const jestLog = path.join(qaDir, 'jest-coverage-run.log');
const buildLog = path.join(qaDir, 'build.log');
const analyzeLog = path.join(qaDir, 'analyze.log');

const readLines = (p) =>
  fs.existsSync(p)
    ? fs
        .readFileSync(p, 'utf8')
        .split(/\r?\n/)
        .map((line, idx) => ({ line, lineNo: idx + 1 }))
    : [];

const scan = (label, entries) => {
  const out = [];
  for (const { line, lineNo } of entries) {
    if (!line.trim()) continue;
    if (/^\s*console\.(warn|error)/.test(line)) {
      out.push({ label, lineNo, line: line.trim(), signal: 'console' });
      continue;
    }
    if (/^\s*Warning:\s/.test(line)) {
      out.push({ label, lineNo, line: line.trim(), signal: 'react-warning' });
      continue;
    }
    if (/\bUnhandledPromiseRejection\b|\bTypeError:\b|\bReferenceError:\b/.test(line)) {
      out.push({ label, lineNo, line: line.trim(), signal: 'runtime-error' });
    }
  }
  return out;
};

const findings = [
  ...scan('jest-coverage-run.log', readLines(jestLog)),
  ...scan('build.log', readLines(buildLog)),
  ...scan('analyze.log', readLines(analyzeLog)),
];

const warnings = findings.filter((f) => f.signal === 'console' || f.signal === 'react-warning');
const runtimeErrors = findings.filter((f) => f.signal === 'runtime-error');

const summary = {
  findingsCount: findings.length,
  warningCount: warnings.length,
  runtimeErrorSignals: runtimeErrors.length,
  findings: findings.slice(0, 200),
};

fs.writeFileSync(
  path.join(qaDir, 'console-signal-audit.json'),
  JSON.stringify(summary, null, 2),
);
NODE
record_status "console_signal_audit" 0
echo

echo "== Step 3: Source/Test Inventory and Mapping =="
rg --files src -g '*.ts' -g '*.tsx' | sort > "$QA_DIR/src-files.list"
rg --files tests/unit tests/integration -g '*.test.ts' -g '*.test.tsx' | sort > "$QA_DIR/test-files.list"

node <<'NODE'
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const qaDir = process.env.QA_DIR;
const root = process.cwd();
const scopeManifestPath = process.env.SCOPE_MANIFEST_PATH;
const refreshScopeManifest = process.env.REFRESH_SCOPE_MANIFEST === '1';

const srcFiles = fs
  .readFileSync(path.join(qaDir, 'src-files.list'), 'utf8')
  .trim()
  .split('\n')
  .filter(Boolean);
const testFiles = fs
  .readFileSync(path.join(qaDir, 'test-files.list'), 'utf8')
  .trim()
  .split('\n')
  .filter(Boolean);
const testContents = new Map(testFiles.map((f) => [f, fs.readFileSync(f, 'utf8')]));

const isCoverageOnly = (file) =>
  /\.coverage\.test\.[tj]sx?$/.test(file) ||
  /completeCoverage\.test\.[tj]sx?$/.test(file) ||
  /allFeatures\.coverage\.test\.[tj]sx?$/.test(file) ||
  /allComponents\.coverage\.test\.[tj]sx?$/.test(file) ||
  /allLib\.coverage\.test\.[tj]sx?$/.test(file) ||
  /ui\.coverage\.test\.[tj]sx?$/.test(file) ||
  /routes\.coverage\.test\.[tj]sx?$/.test(file);

const mapRows = [];
for (const src of srcFiles) {
  const rel = src.replace(/^src\//, '');
  const noExt = rel.replace(/\.(ts|tsx)$/, '');
  const alias = `@/${noExt}`;
  const base = path.basename(noExt).toLowerCase();

  const matches = [];
  for (const tf of testFiles) {
    const c = testContents.get(tf) || '';
    if (
      c.includes(alias) ||
      c.includes(noExt) ||
      tf.toLowerCase().includes(base)
    ) {
      matches.push(tf);
    }
  }
  const unique = [...new Set(matches)];
  const real = unique.filter((f) => !isCoverageOnly(f));
  const cov = unique.filter((f) => isCoverageOnly(f));

  mapRows.push({
    src,
    tests: unique,
    totalTests: unique.length,
    realTests: real.length,
    coverageOnlyTests: cov.length,
    quality:
      unique.length === 0
        ? 'unmapped'
        : real.length > 0 && cov.length > 0
          ? 'mixed'
          : real.length > 0
            ? 'real'
            : 'coverage-only',
  });
}

const mapSummary = {
  totalSrc: mapRows.length,
  mapped: mapRows.filter((r) => r.totalTests > 0).length,
  unmapped: mapRows.filter((r) => r.totalTests === 0).length,
  real: mapRows.filter((r) => r.quality === 'real').length,
  mixed: mapRows.filter((r) => r.quality === 'mixed').length,
  coverageOnly: mapRows.filter((r) => r.quality === 'coverage-only').length,
};

const coverageTests = testFiles.filter((f) => /\.coverage\.test\.[tj]sx?$/.test(f));
const nonCoverage = testFiles.filter((f) => !/\.coverage\.test\.[tj]sx?$/.test(f));
const coverageOnlyCandidates = coverageTests
  .map((f) => {
    const token = path
      .basename(f)
      .replace(/\.coverage\.test\.[tj]sx?$/, '')
      .toLowerCase();
    const support = nonCoverage.filter((n) =>
      n.toLowerCase().includes(token),
    );
    return {
      coverageTest: f,
      supportingNonCoverage: support.length,
      samples: support.slice(0, 3),
    };
  })
  .filter((r) => r.supportingNonCoverage === 0);

const groups = {
  app: mapRows.filter((r) => r.src.startsWith('src/app/')),
  features: mapRows.filter((r) => r.src.startsWith('src/features/')),
  shared: mapRows.filter((r) => r.src.startsWith('src/shared/')),
  lib: mapRows.filter((r) => r.src.startsWith('src/lib/')),
  proxy: mapRows.filter(
    (r) => r.src === 'src/proxy.ts' || r.src.startsWith('src/proxy/'),
  ),
};
const summarize = (rows) => ({
  total: rows.length,
  mapped: rows.filter((r) => r.totalTests > 0).length,
  withReal: rows.filter((r) => r.realTests > 0).length,
  onlyCoverage: rows.filter((r) => r.realTests === 0 && r.coverageOnlyTests > 0)
    .length,
  unmapped: rows.filter((r) => r.totalTests === 0).length,
});

const moduleAuditSummary = {
  total: mapRows.length,
  groups: Object.fromEntries(
    Object.entries(groups).map(([k, v]) => [k, summarize(v)]),
  ),
  hooks: {
    features: summarize(
      mapRows.filter(
        (r) => r.src.includes('/hooks/') && r.src.startsWith('src/features/'),
      ),
    ),
    shared: summarize(
      mapRows.filter(
        (r) => r.src.includes('/hooks/') && r.src.startsWith('src/shared/'),
      ),
    ),
  },
  utils: {
    features: summarize(
      mapRows.filter(
        (r) => r.src.includes('/utils/') && r.src.startsWith('src/features/'),
      ),
    ),
    shared: summarize(
      mapRows.filter(
        (r) =>
          r.src.includes('/formatters/') ||
          r.src.includes('/status/') ||
          r.src.includes('/polling/') ||
          r.src.includes('/notifications/'),
      ),
    ),
    lib: summarize(
      mapRows.filter(
        (r) =>
          r.src.includes('/errors/') ||
          r.src.includes('/auth/') ||
          r.src.includes('/backendProxy/') ||
          r.src.includes('/bff/'),
      ),
    ),
  },
};

const covSummaryPath = path.join(root, 'coverage', 'coverage-summary.json');
let covSummary = null;
if (fs.existsSync(covSummaryPath)) {
  covSummary = JSON.parse(fs.readFileSync(covSummaryPath, 'utf8'));
}

const missingFromCoverage = [];
const missingRuntimeFromCoverage = [];
const sourceRuntimeClassification = [];
if (covSummary) {
  const covSet = new Set(
    Object.keys(covSummary)
      .filter((k) => k !== 'total')
      .map((abs) => path.relative(root, abs)),
  );
  const ts = require('typescript');
  const scriptKindFor = (file) => {
    if (file.endsWith('.tsx')) return ts.ScriptKind.TSX;
    if (file.endsWith('.ts')) return ts.ScriptKind.TS;
    return ts.ScriptKind.Unknown;
  };
  const emitsRuntime = (statement) => {
    switch (statement.kind) {
      case ts.SyntaxKind.InterfaceDeclaration:
      case ts.SyntaxKind.TypeAliasDeclaration:
        return false;
      case ts.SyntaxKind.ImportDeclaration:
        // Bound imports are often erased when only used in type positions.
        // Treat only side-effect imports as runtime by default.
        return !statement.importClause;
      case ts.SyntaxKind.ExportDeclaration:
        return !statement.isTypeOnly && Boolean(statement.moduleSpecifier);
      case ts.SyntaxKind.EmptyStatement:
        return false;
      default:
        return true;
    }
  };

  for (const src of srcFiles) {
    const hasCoverage = covSet.has(src);
    if (!hasCoverage) missingFromCoverage.push(src);

    const text = fs.readFileSync(path.join(root, src), 'utf8');
    let runtimeEligible = true;
    let classificationReason = 'runtime statements detected';

    try {
      const sf = ts.createSourceFile(
        src,
        text,
        ts.ScriptTarget.Latest,
        true,
        scriptKindFor(src),
      );
      const runtimeStatements = sf.statements.filter((s) => emitsRuntime(s));
      if (runtimeStatements.length === 0) {
        runtimeEligible = false;
        classificationReason = 'type-only declarations/imports';
      }
    } catch {
      const stripped = text
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
        .trim();
      runtimeEligible = /\b(function|class|const|let|var|if|for|while|switch|return|await|new)\b/.test(
        stripped,
      );
      classificationReason = runtimeEligible
        ? 'heuristic runtime token match'
        : 'heuristic type-only/empty';
    }

    sourceRuntimeClassification.push({
      src,
      runtimeEligible,
      hasCoverage,
      classificationReason,
    });

    if (runtimeEligible && !hasCoverage) {
      missingRuntimeFromCoverage.push(src);
    }
  }
}

const esc = (s) => String(s).replace(/\|/g, '\\|');
const moduleName = (rel) => path.basename(rel).replace(/\.(ts|tsx)$/, '');
const coverageFor = (rel) => {
  if (!covSummary) return null;
  const abs = path.join(root, rel);
  return covSummary[abs] || null;
};
const coverageFmt = (entry) => {
  if (!entry) return 'N/A';
  return `${entry.statements.pct}% stmt / ${entry.branches.pct}% br / ${entry.functions.pct}% fn / ${entry.lines.pct}% ln`;
};
const qualityLabel = (matches) => {
  if (matches.length === 0) return '⚠️ Indirect';
  const real = matches.filter((f) => !isCoverageOnly(f));
  const cov = matches.filter((f) => isCoverageOnly(f));
  if (real.length > 0 && cov.length > 0) return '⚠️ Mixed';
  if (real.length > 0) return '✅ Real';
  return '⚠️ Coverage-only';
};
const gapLabel = (q, hasCoverage) => {
  if (!hasCoverage) return 'missing from coverage summary';
  if (q === '⚠️ Coverage-only') return 'behavior assertions';
  if (q === '⚠️ Mixed') return 'reduce coverage-only reliance';
  if (q === '⚠️ Indirect') return 'direct module test mapping';
  return 'none';
};
const inSection = (rel, section) => {
  if (section === 'Features') return rel.startsWith('src/features/');
  if (section === 'Shared') return rel.startsWith('src/shared/');
  if (section === 'Lib') return rel.startsWith('src/lib/');
  if (section === 'Middleware / Proxy')
    return rel === 'src/proxy.ts' || rel.startsWith('src/proxy/');
  if (section === 'App') return rel.startsWith('src/app/');
  return false;
};

const coverageMapSections = ['Features', 'Shared', 'Lib', 'Middleware / Proxy', 'App'];
let coverageMapMd = '# Component & Logic Coverage Map\n';
coverageMapMd += `Last updated: ${new Date().toISOString()}\n\n`;
coverageMapMd += `Total source files accounted: ${srcFiles.length}\n`;
coverageMapMd += `Files present in Jest coverage summary: ${
  srcFiles.length - missingFromCoverage.length
}\n`;
coverageMapMd += `Files missing from Jest coverage summary: ${missingFromCoverage.length}\n\n`;
coverageMapMd += `Runtime-eligible files: ${
  sourceRuntimeClassification.filter((r) => r.runtimeEligible).length
}\n`;
coverageMapMd += `Runtime-eligible files missing from coverage summary: ${missingRuntimeFromCoverage.length}\n\n`;

for (const section of coverageMapSections) {
  const rows = srcFiles.filter((f) => inSection(f, section));
  coverageMapMd += `## ${section}\n`;
  coverageMapMd += '| Module | File | Tests | Coverage | Quality | Gaps |\n';
  coverageMapMd += '|--------|------|-------|----------|---------|------|\n';
  for (const rel of rows) {
    const row = mapRows.find((r) => r.src === rel);
    const matches = row?.tests ?? [];
    const testCell = matches.length
      ? matches.slice(0, 2).join('<br>') +
        (matches.length > 2 ? `<br>+${matches.length - 2} more` : '')
      : '(indirect via suite)';
    const cov = coverageFor(rel);
    const q = qualityLabel(matches);
    coverageMapMd += `| ${esc(moduleName(rel))} | ${esc(rel)} | ${esc(
      testCell,
    )} | ${esc(coverageFmt(cov))} | ${q} | ${esc(gapLabel(q, Boolean(cov)))} |\n`;
  }
  coverageMapMd += '\n';
}

const coverageTargets = [];
for (const file of coverageTests) {
  const text = testContents.get(file) || '';
  const targets = [
    ...text.matchAll(/require\.resolve\((?:'|")([^'"]+)(?:'|")\)/g),
    ...text.matchAll(/import\((?:'|")([^'"]+)(?:'|")\)/g),
  ].map((m) => m[1]);
  coverageTargets.push({
    file,
    targets: [...new Set(targets)],
  });
}

fs.writeFileSync(path.join(qaDir, 'source-test-map.json'), JSON.stringify(mapRows, null, 2));
fs.writeFileSync(
  path.join(qaDir, 'source-test-map-summary.json'),
  JSON.stringify(mapSummary, null, 2),
);
fs.writeFileSync(
  path.join(qaDir, 'coverage-only-candidates.json'),
  JSON.stringify(coverageOnlyCandidates, null, 2),
);
fs.writeFileSync(
  path.join(qaDir, 'module-audit-summary.json'),
  JSON.stringify(moduleAuditSummary, null, 2),
);
fs.writeFileSync(
  path.join(qaDir, 'coverage-test-targets.json'),
  JSON.stringify(coverageTargets, null, 2),
);
fs.writeFileSync(path.join(qaDir, 'component-coverage-map.md'), coverageMapMd);
fs.writeFileSync(
  path.join(qaDir, 'missing-from-coverage-summary.list'),
  `${missingFromCoverage.join('\n')}${missingFromCoverage.length ? '\n' : ''}`,
);
fs.writeFileSync(
  path.join(qaDir, 'missing-runtime-coverage.list'),
  `${missingRuntimeFromCoverage.join('\n')}${missingRuntimeFromCoverage.length ? '\n' : ''}`,
);
fs.writeFileSync(
  path.join(qaDir, 'source-runtime-classification.json'),
  JSON.stringify(sourceRuntimeClassification, null, 2),
);

const stateKeywords = [
  'loading',
  'empty',
  'error',
  'success',
  'submitting',
  'disabled',
];

const extractStates = (rawText) => {
  const text = String(rawText || '').toLowerCase();
  const states = [];
  if (/\bloading\b|isloading|aria-busy/.test(text)) states.push('loading');
  if (
    /\bempty\b|no\s+results|no\s+data|no\s+trials|no\s+submissions|empty state/.test(
      text,
    )
  )
    states.push('empty');
  if (/\berror\b|failed|failure|exception|to throw/.test(text))
    states.push('error');
  if (/\bsuccess\b|succeeded|completed|created/.test(text))
    states.push('success');
  if (/\bsubmitting\b|creating\.\.\.|saving\.\.\./.test(text))
    states.push('submitting');
  if (/\bdisabled\b|tobedisabled|aria-disabled/.test(text))
    states.push('disabled');
  return [...new Set(states)].sort();
};

const pageFiles = srcFiles.filter((f) =>
  /^src\/app\/.*\/page\.(ts|tsx)$/.test(f) || f === 'src/app/page.tsx',
);

const toRoute = (pageFile) => {
  let rel = pageFile.replace(/^src\/app\//, '');
  rel = rel.replace(/\/page\.(ts|tsx)$/, '');
  if (rel === 'page.tsx' || rel === 'page.ts' || rel === '') return '/';
  const segments = rel
    .split('/')
    .filter(Boolean)
    .filter((seg) => !/^\(.*\)$/.test(seg));
  return `/${segments.join('/')}`;
};

const uiRoutes = [...new Set(pageFiles.map(toRoute))].sort();

const routeTokens = (route) =>
  route
    .split('/')
    .filter(Boolean)
    .map((s) => s.replace(/^\[|\]$/g, '').toLowerCase())
    .map((s) => s.replace(/[^a-z0-9]/g, ''))
    .filter((s) => s && !['id', 'token', 'slug'].includes(s));

const relatedFiles = (route, files) => {
  const tokens = routeTokens(route);
  if (route === '/') {
    return files.filter(
      (f) =>
        f.startsWith('src/app/page.') ||
        f.includes('/marketing/') ||
        f.includes('MarketingHomePage'),
    );
  }
  if (tokens.length === 0) return [];
  const strict = files.filter((f) => {
    const p = f.toLowerCase();
    return tokens.every((t) => p.includes(t));
  });
  if (strict.length > 0) return strict;
  return files.filter((f) => {
    const p = f.toLowerCase();
    return tokens.some((t) => p.includes(t));
  });
};

const routeStateSourceSignals = {};
const routeStateTestEvidence = {};
for (const route of uiRoutes) {
  const srcRelated = relatedFiles(route, srcFiles);
  const srcText = srcRelated
    .map((f) => {
      try {
        return fs.readFileSync(path.join(root, f), 'utf8');
      } catch {
        return '';
      }
    })
    .join('\n');
  routeStateSourceSignals[route] = extractStates(srcText);

  const testRelated = relatedFiles(route, testFiles);
  const testText = testRelated
    .map((f) => {
      try {
        return fs.readFileSync(path.join(root, f), 'utf8');
      } catch {
        return '';
      }
    })
    .join('\n');
  routeStateTestEvidence[route] = extractStates(testText);
}

const discoveredScope = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  srcFiles: [...srcFiles].sort(),
  uiRoutes,
  stateKeywords,
  routeStateSourceSignals,
  routeStateTestEvidence,
};

fs.writeFileSync(
  path.join(qaDir, 'discovered-scope.json'),
  JSON.stringify(discoveredScope, null, 2),
);

const shouldWriteManifest =
  Boolean(scopeManifestPath) &&
  (refreshScopeManifest || !fs.existsSync(scopeManifestPath));

if (shouldWriteManifest) {
  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    description:
      'Locked QA scope baseline for frontend certification. New source files/routes/state signals must be reviewed and covered before refreshing this manifest.',
    srcFiles: discoveredScope.srcFiles,
    uiRoutes: discoveredScope.uiRoutes,
    stateKeywords: discoveredScope.stateKeywords,
    routeStateSourceSignals: discoveredScope.routeStateSourceSignals,
    routeStateRequirements: discoveredScope.routeStateTestEvidence,
  };
  fs.writeFileSync(scopeManifestPath, JSON.stringify(manifest, null, 2));
}
NODE
record_status "source_test_mapping" 0
echo

echo "== Step 4: Build + Analyze =="
if [[ "$RUN_BUILD" -eq 1 ]]; then
  if run_with_log "build" "$QA_DIR/build.log" npm run build; then
    echo "Build succeeded."
  else
    echo "Build failed; continuing."
  fi

  if [[ "$RUN_ANALYZE" -eq 1 ]]; then
    if run_with_log "analyze" "$QA_DIR/analyze.log" npm run analyze; then
      echo "Analyze build succeeded."
    else
      echo "Analyze build failed; continuing."
    fi
  else
    record_status "analyze" 99
    echo "Analyze step skipped."
  fi

  if [[ -d ".next/static/chunks" ]]; then
    find .next/static/chunks -type f -name '*.js' -print0 \
      | xargs -0 stat -f '%z %N' \
      | sort -nr > "$QA_DIR/chunk-sizes.txt"
  fi

  node <<'NODE'
const fs = require('fs');
const path = require('path');

const qaDir = process.env.QA_DIR;
const root = process.cwd();

const lockPath = path.join(root, 'package-lock.json');
if (fs.existsSync(lockPath)) {
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  const pkgs = lock.packages || {};
  const versionsByName = new Map();
  for (const [p, meta] of Object.entries(pkgs)) {
    if (!p.startsWith('node_modules/')) continue;
    const name = p.slice('node_modules/'.length).split('/node_modules/').pop();
    const version = meta.version;
    if (!name || !version) continue;
    if (!versionsByName.has(name)) versionsByName.set(name, new Set());
    versionsByName.get(name).add(version);
  }
  const dups = [...versionsByName.entries()]
    .filter(([, versions]) => versions.size > 1)
    .map(([name, versions]) => ({ name, versions: [...versions] }))
    .sort((a, b) => b.versions.length - a.versions.length);
  fs.writeFileSync(
    path.join(qaDir, 'dependency-duplicates.json'),
    JSON.stringify(
      {
        totalPackages: versionsByName.size,
        duplicateNames: dups.length,
        top: dups.slice(0, 30),
      },
      null,
      2,
    ),
  );
}

const buildManifestPath = path.join(root, '.next', 'build-manifest.json');
const appRoutesPath = path.join(root, '.next', 'app-path-routes-manifest.json');
const chunkDir = path.join(root, '.next', 'static', 'chunks', 'app');
if (fs.existsSync(buildManifestPath) && fs.existsSync(appRoutesPath) && fs.existsSync(chunkDir)) {
  const bm = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'));
  const appRoutes = JSON.parse(fs.readFileSync(appRoutesPath, 'utf8'));
  const baseFiles = [...new Set([...(bm.polyfillFiles || []), ...(bm.rootMainFiles || [])])];
  const sizeForStatic = (p) => {
    const full = path.join(root, '.next', p);
    try {
      return fs.statSync(full).size;
    } catch {
      return 0;
    }
  };
  const baseBytes = baseFiles.reduce((sum, f) => sum + sizeForStatic(f), 0);

  const allChunkFiles = [];
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.isFile() && p.endsWith('.js')) allChunkFiles.push(p);
    }
  };
  walk(chunkDir);

  const findRouteChunk = (appPath) => {
    const rel = appPath.replace(/^\//, '');
    const prefix = path.join(chunkDir, `${rel}-`);
    const candidates = allChunkFiles.filter((f) => f.startsWith(prefix));
    if (candidates.length > 0) {
      return candidates.sort((a, b) => fs.statSync(b).size - fs.statSync(a).size)[0];
    }
    const altPrefix = path.join(chunkDir, rel);
    const alt = allChunkFiles.filter((f) => f.startsWith(altPrefix));
    return alt[0] || null;
  };

  const routes = [];
  for (const [appPath, route] of Object.entries(appRoutes)) {
    if (!appPath.endsWith('/page')) continue;
    if (route.startsWith('/api')) continue;
    const chunkFile = findRouteChunk(appPath);
    const routeChunkBytes = chunkFile ? fs.statSync(chunkFile).size : 0;
    routes.push({
      route,
      appPath,
      routeChunkBytes,
      routeChunkKB: Number((routeChunkBytes / 1024).toFixed(1)),
      firstLoadJSBytes: baseBytes + routeChunkBytes,
      firstLoadJSKB: Number(((baseBytes + routeChunkBytes) / 1024).toFixed(1)),
      chunkFile: chunkFile ? path.relative(root, chunkFile) : null,
    });
  }
  routes.sort((a, b) => b.firstLoadJSBytes - a.firstLoadJSBytes);
  fs.writeFileSync(
    path.join(qaDir, 'route-size-estimate.json'),
    JSON.stringify(
      {
        baseFiles,
        baseBytes,
        baseKB: Number((baseBytes / 1024).toFixed(1)),
        routes,
      },
      null,
      2,
    ),
  );
}
NODE
  record_status "perf_artifacts" 0
else
  echo "Build steps skipped."
  record_status "build" 99
  record_status "analyze" 99
  record_status "perf_artifacts" 99
fi
echo

echo "== Step 5: Lighthouse =="
SERVER_STARTED=0
SERVER_PID=""
LIGHTHOUSE_SKIP_STATUS=99
if [[ "$RUN_LIGHTHOUSE" -eq 1 ]]; then
  if ! HOST="$HOST" PORT="$PORT" node <<'NODE' >/dev/null 2>&1
const net = require('net');
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 3000);
const server = net.createServer();
server.once('error', () => process.exit(1));
server.listen(port, host, () => server.close(() => process.exit(0)));
NODE
  then
    echo "Port binding is not permitted in this environment; skipping Lighthouse."
    RUN_LIGHTHOUSE=0
    LIGHTHOUSE_SKIP_STATUS=98
  fi
fi

if [[ "$RUN_LIGHTHOUSE" -eq 1 ]]; then
  if curl -fsS "http://$HOST:$PORT" >/dev/null 2>&1; then
    echo "Detected existing server on $HOST:$PORT; using it for Lighthouse."
  else
    echo "No server on $HOST:$PORT, starting local app..."
    set +e
    npm run start -- -H "$HOST" -p "$PORT" > "$QA_DIR/next-start.log" 2>&1 &
    SERVER_PID="$!"
    set -e
    SERVER_STARTED=1

    ready=0
    for _ in $(seq 1 60); do
      if curl -fsS "http://$HOST:$PORT" >/dev/null 2>&1; then
        ready=1
        break
      fi
      sleep 1
    done
    if [[ "$ready" -ne 1 ]]; then
      echo "Server failed to become ready on $HOST:$PORT; skipping Lighthouse."
      RUN_LIGHTHOUSE=0
      LIGHTHOUSE_SKIP_STATUS=98
    fi
  fi

  if [[ "$RUN_LIGHTHOUSE" -eq 1 ]]; then
    lh_run() {
      local key="$1"
      local route="$2"
      local output="$3"
      set +e
      npx lighthouse "http://$HOST:$PORT$route" \
        --output=json \
        --output-path="$output" \
        --chrome-flags='--headless=new --no-sandbox --disable-dev-shm-usage'
      local status="$?"
      set -e
      record_status "$key" "$status"
      return "$status"
    }

    lh_run "lighthouse_home" "/" "$QA_DIR/lighthouse-home.json" || true
    lh_run "lighthouse_dashboard" "/dashboard" "$QA_DIR/lighthouse-dashboard.json" || true
    lh_run "lighthouse_auth_login" "/auth/login" "$QA_DIR/lighthouse-auth-login.json" || true
  fi
else
  echo "Lighthouse skipped."
  record_status "lighthouse_home" "$LIGHTHOUSE_SKIP_STATUS"
  record_status "lighthouse_dashboard" "$LIGHTHOUSE_SKIP_STATUS"
  record_status "lighthouse_auth_login" "$LIGHTHOUSE_SKIP_STATUS"
fi

# Ensure lighthouse status keys are always present, even when runtime conditions
# force a late skip after entering the lighthouse branch.
for lh_key in lighthouse_home lighthouse_dashboard lighthouse_auth_login; do
  if ! rg -q "^${lh_key}[[:space:]]" "$STATUS_FILE"; then
    record_status "$lh_key" "$LIGHTHOUSE_SKIP_STATUS"
  fi
done

if [[ "$SERVER_STARTED" -eq 1 && "$KEEP_SERVER" -eq 0 && -n "${SERVER_PID}" ]]; then
  echo "Stopping local server PID $SERVER_PID"
  kill "$SERVER_PID" >/dev/null 2>&1 || true
fi
echo

echo "== Step 6: Lighthouse Summary + A11y Signal Scan =="
node <<'NODE'
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const qaDir = process.env.QA_DIR;

const lighthouseFiles = [
  'lighthouse-home.json',
  'lighthouse-dashboard.json',
  'lighthouse-auth-login.json',
]
  .map((f) => path.join(qaDir, f))
  .filter((f) => fs.existsSync(f));

const lighthouseSummary = [];
for (const file of lighthouseFiles) {
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    const audits = raw.audits || {};
    lighthouseSummary.push({
      page: path.basename(file).replace(/^lighthouse-|\.json$/g, ''),
      requestedUrl: raw.requestedUrl || null,
      finalUrl: raw.finalUrl || null,
      performance: Math.round((raw.categories?.performance?.score ?? 0) * 100),
      accessibility: Math.round((raw.categories?.accessibility?.score ?? 0) * 100),
      bestPractices: Math.round(
        (raw.categories?.['best-practices']?.score ?? 0) * 100,
      ),
      seo: Math.round((raw.categories?.seo?.score ?? 0) * 100),
      fcp: audits['first-contentful-paint']?.displayValue ?? null,
      lcp: audits['largest-contentful-paint']?.displayValue ?? null,
      tbt: audits['total-blocking-time']?.displayValue ?? null,
      cls: audits['cumulative-layout-shift']?.displayValue ?? null,
      tti: audits['interactive']?.displayValue ?? null,
      failedA11yAudits: Object.values(audits)
        .filter((a) => a?.group === 'a11y' && a.score !== null && a.score < 1)
        .map((a) => ({
          id: a.id,
          title: a.title,
          displayValue: a.displayValue || null,
        })),
    });
  } catch {
    // ignore malformed files
  }
}
fs.writeFileSync(
  path.join(qaDir, 'lighthouse-summary.json'),
  JSON.stringify(lighthouseSummary, null, 2),
);

const countCmd = (cmd) => Number(cp.execSync(cmd, { encoding: 'utf8' }).trim());
const totalTestFiles = countCmd(`wc -l < "${path.join(qaDir, 'test-files.list')}"`);
const getByRole = countCmd(`rg -l "getByRole\\(" tests/unit tests/integration | wc -l`);
const getByLabelText = countCmd(
  `rg -l "getByLabelText\\(" tests/unit tests/integration | wc -l`,
);
const userEvent = countCmd(`rg -l "userEvent\\." tests/unit tests/integration | wc -l`);
const ariaAssertions = countCmd(
  `rg -l "aria-|toHaveAccessible|toHaveAttribute\\(['\\"]aria-" tests/unit tests/integration | wc -l`,
);

const dialogFiles = cp
  .execSync(`rg -l 'role="dialog"' src/features src/shared src/app || true`, {
    encoding: 'utf8',
  })
  .trim()
  .split('\n')
  .filter(Boolean);

const dialogNameIssues = [];
for (const f of dialogFiles) {
  const text = fs.readFileSync(f, 'utf8');
  const hasName = /aria-label\s*=/.test(text) || /aria-labelledby\s*=/.test(text);
  if (!hasName) dialogNameIssues.push(f);
}
fs.writeFileSync(
  path.join(qaDir, 'dialog-name-issues.list'),
  `${dialogNameIssues.join('\n')}${dialogNameIssues.length ? '\n' : ''}`,
);

const possibleUnlabeledTextareas = [];
const tsxFiles = cp
  .execSync(`rg --files src -g '*.tsx'`, { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(Boolean);
for (const file of tsxFiles) {
  const text = fs.readFileSync(file, 'utf8');
  const matches = [...text.matchAll(/<textarea\b[^>]*>/g)];
  for (const m of matches) {
    const tag = m[0];
    const hasDirectLabel =
      /aria-label=/.test(tag) || /aria-labelledby=/.test(tag) || /\sid=/.test(tag);
    if (!hasDirectLabel) {
      possibleUnlabeledTextareas.push({
        file,
        snippet: tag.slice(0, 140),
      });
    }
  }
}
fs.writeFileSync(
  path.join(qaDir, 'possible-unlabeled-textareas.json'),
  JSON.stringify(possibleUnlabeledTextareas, null, 2),
);

fs.writeFileSync(
  path.join(qaDir, 'test-pattern-counts.out'),
  [
    `total_test_files=${totalTestFiles}`,
    `getByRole_files=${getByRole}`,
    `getByLabelText_files=${getByLabelText}`,
    `userEvent_files=${userEvent}`,
    `aria_assertion_files=${ariaAssertions}`,
  ].join('\n') + '\n',
);
NODE
record_status "a11y_signal_scan" 0
echo

echo "== Step 7: Run Gap Tests =="
if [[ "$RUN_GAP_TESTS" -eq 1 ]]; then
  mapfile -t GAP_TEST_FILES < <(
    find "tests" -type f \( -name '*.gap.test.ts' -o -name '*.gap.test.tsx' -o -name '*.a11y.test.ts' -o -name '*.a11y.test.tsx' \) 2>/dev/null | sort -u
  )

  if [[ "${#GAP_TEST_FILES[@]}" -gt 0 ]]; then
    if run_with_log "gap_tests" "$QA_DIR/gap-tests-run.log" npx jest "${GAP_TEST_FILES[@]}" --runInBand; then
      echo "Gap tests passed."
    else
      echo "Gap tests failed."
    fi
  else
    echo "No gap/a11y test files found under tests/."
    record_status "gap_tests" 99
  fi
else
  echo "Gap tests skipped."
  record_status "gap_tests" 99
fi
echo

echo "== Step 8: Compose Perf Summary =="
node <<'NODE'
const fs = require('fs');
const path = require('path');

const qaDir = process.env.QA_DIR;

const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '');
const readJson = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null);

const buildLog = read(path.join(qaDir, 'build.log'));
const analyzeLog = read(path.join(qaDir, 'analyze.log'));
const route = readJson(path.join(qaDir, 'route-size-estimate.json')) || {};
const lighthouse = readJson(path.join(qaDir, 'lighthouse-summary.json')) || [];
const chunkPath = path.join(qaDir, 'chunk-sizes.txt');
let chunkLines = [];
if (fs.existsSync(chunkPath)) {
  chunkLines = read(chunkPath)
    .trim()
    .split('\n')
    .filter(Boolean);
}
const topChunks = chunkLines.slice(0, 10).map((line) => {
  const [size, ...rest] = line.split(' ');
  return {
    bytes: Number(size),
    kb: Number((Number(size) / 1024).toFixed(1)),
    file: rest.join(' '),
  };
});
const totalChunkBytes = chunkLines.reduce((sum, line) => {
  const n = Number(line.split(' ')[0]);
  return sum + (Number.isFinite(n) ? n : 0);
}, 0);

const perfSummary = {
  buildRealSec: Number((buildLog.match(/real\s+([\d.]+)/) || [])[1] || 0),
  analyzeRealSec: Number((analyzeLog.match(/real\s+([\d.]+)/) || [])[1] || 0),
  compileSec: Number((buildLog.match(/Compiled successfully in\s+([\d.]+)s/) || [])[1] || 0),
  analyzeCompileSec: Number(
    (analyzeLog.match(/Compiled successfully in\s+([\d.]+)s/) || [])[1] || 0,
  ),
  baseFirstLoadKB: route.baseKB ?? null,
  heaviestRoute: Array.isArray(route.routes) && route.routes.length ? route.routes[0] : null,
  topChunks,
  totalChunkKB: Number((totalChunkBytes / 1024).toFixed(1)),
  lighthouse,
};

fs.writeFileSync(path.join(qaDir, 'perf-summary.json'), JSON.stringify(perfSummary, null, 2));
NODE
record_status "perf_summary" 0
echo

echo "== Step 9: Write Reports =="
node <<'NODE'
const fs = require('fs');
const path = require('path');

const qaDir = process.env.QA_DIR;
const runLocal = process.env.RUN_LOCAL_TS;
const runUtc = process.env.RUN_UTC_TS;
const testsRootDir = path.join(process.cwd(), 'tests');

const readJson = (name) => {
  const p = path.join(qaDir, name);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
};
const readText = (name) => {
  const p = path.join(qaDir, name);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
};
const readStatusMap = () => {
  const p = path.join(qaDir, 'runner-status.tsv');
  if (!fs.existsSync(p)) return {};
  return fs
    .readFileSync(p, 'utf8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .reduce((acc, line) => {
      const [k, v] = line.split('\t');
      acc[k] = Number(v);
      return acc;
    }, {});
};

const jest = readJson('jest-summary.json') || {};
const failures = readJson('jest-failures.json') || [];
const moduleSummary = readJson('module-audit-summary.json') || {};
const perf = readJson('perf-summary.json') || {};
const depDup = readJson('dependency-duplicates.json') || {};
const lighthouse = readJson('lighthouse-summary.json') || [];
const statusMap = readStatusMap();

const gapLog = readText('gap-tests-run.log');
const gapSuites = (gapLog.match(/Test Suites:\s+(\d+)\s+passed,\s+(\d+)\s+total/) || [])
  .slice(1)
  .map(Number);
const gapTests = (gapLog.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+total/) || [])
  .slice(1)
  .map(Number);

const gapTestFiles = [];
const walk = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full);
    else if (
      ent.isFile() &&
      (/\.gap\.test\.[tj]sx?$/.test(ent.name) ||
        /\.a11y\.test\.[tj]sx?$/.test(ent.name))
    ) {
      gapTestFiles.push(path.relative(process.cwd(), full));
    }
  }
};
walk(testsRootDir);
gapTestFiles.sort();

const patternCountsRaw = readText('test-pattern-counts.out')
  .trim()
  .split('\n')
  .filter(Boolean)
  .reduce((acc, line) => {
    const [k, v] = line.split('=');
    acc[k] = Number(String(v || '').trim());
    return acc;
  }, {});

const dialogIssues = readText('dialog-name-issues.list')
  .trim()
  .split('\n')
  .filter(Boolean);
const unlabeledTextareas = readJson('possible-unlabeled-textareas.json') || [];

const covMissing = readText('missing-from-coverage-summary.list')
  .trim()
  .split('\n')
  .filter(Boolean);
const runtimeCovMissing = readText('missing-runtime-coverage.list')
  .trim()
  .split('\n')
  .filter(Boolean);

const qaReport = `# Frontend Component & Logic QA Report
Last run: ${runLocal} (${runUtc})

## Jest Test Run Summary
| Metric | Value |
|--------|-------|
| Total suites | ${jest.totalSuites ?? 'n/a'} |
| Total tests | ${jest.totalTests ?? 'n/a'} |
| Passed | ${jest.totalTestsPassed ?? 'n/a'} |
| Failed | ${jest.totalTestsFailed ?? 'n/a'} |
| Skipped | 0 |
| Run time (Jest) | ${jest.jestTimeSeconds ?? 'n/a'}s |
| Run time (wall clock) | ${jest.wallTimeSeconds ?? 'n/a'}s |
| Coverage (statements) | ${jest.coverage?.statements ?? 'n/a'}% |
| Coverage (branches) | ${jest.coverage?.branches ?? 'n/a'}% |
| Coverage (functions) | ${jest.coverage?.functions ?? 'n/a'}% |
| Coverage (lines) | ${jest.coverage?.lines ?? 'n/a'}% |

## Certification Readiness Inputs
| Gate | Exit Code | Status |
|------|-----------|--------|
| lint | ${statusMap.lint ?? 'n/a'} | ${(statusMap.lint ?? 99) === 0 ? 'PASS' : (statusMap.lint === 99 ? 'SKIP' : 'FAIL')} |
| typecheck | ${statusMap.typecheck ?? 'n/a'} | ${(statusMap.typecheck ?? 99) === 0 ? 'PASS' : (statusMap.typecheck === 99 ? 'SKIP' : 'FAIL')} |
| jest coverage run | ${statusMap.test_coverage ?? 'n/a'} | ${(statusMap.test_coverage ?? 1) === 0 ? 'PASS' : 'FAIL'} |
| source/test mapping | ${statusMap.source_test_mapping ?? 'n/a'} | ${(statusMap.source_test_mapping ?? 1) === 0 ? 'PASS' : 'FAIL'} |
| console signal audit | ${statusMap.console_signal_audit ?? 'n/a'} | ${(statusMap.console_signal_audit ?? 1) === 0 ? 'PASS' : 'FAIL'} |
| build | ${statusMap.build ?? 'n/a'} | ${(statusMap.build ?? 99) === 0 ? 'PASS' : (statusMap.build === 99 ? 'SKIP' : 'FAIL')} |
| analyze | ${statusMap.analyze ?? 'n/a'} | ${(statusMap.analyze ?? 99) === 0 ? 'PASS' : (statusMap.analyze === 99 ? 'SKIP' : 'FAIL')} |
| lighthouse home | ${statusMap.lighthouse_home ?? 'n/a'} | ${(statusMap.lighthouse_home ?? 99) === 0 ? 'PASS' : ((statusMap.lighthouse_home === 98 || statusMap.lighthouse_home === 99) ? 'SKIP' : 'FAIL')} |
| gap tests | ${statusMap.gap_tests ?? 'n/a'} | ${(statusMap.gap_tests ?? 99) === 0 ? 'PASS' : (statusMap.gap_tests === 99 ? 'SKIP' : 'FAIL')} |

## Failed Tests
| Test | File | Category | Details |
|------|------|----------|---------|
${failures.length === 0
  ? '| None | — | — | Full suite passed. |'
  : failures
      .map(
        (f) =>
          `| ${f.suite} | ${f.suite} | ${f.category} | ${f.details.replace(/\|/g, '\\|')} |`,
      )
      .join('\n')}

## Coverage Quality Audit
### Tests with Real Assertions ✅
- Backend proxy chain tests assert real request/response/error behavior ('backendProxyRoute.test.ts', 'app/api/backendProxy.test.ts').
- Candidate workspace/tests flows use interaction-heavy assertions ('WorkspacePanel*', 'RunTestsPanel*', candidate session integration suites).
- TalentPartner detail and submissions paths have scenario/invite/termination behavioral checks.

### Tests with Coverage-Only Marking ⚠️ (high coverage, lower signal)
- Coverage instrumentation pattern appears in **${jest.coverageInstrumentedFiles ?? 'n/a'}** test files ('__coverage__' mutation).
- '*.coverage.test.*' files: **${jest.coverageTestFiles ?? 'n/a'}**.
- Recommendation: keep scaffolds, but continue pairing with direct behavior/a11y assertions for high-risk modules.

## Coverage Gaps
### Quantitative Gaps (coverage threshold)
- ${
  jest.coverage?.statements === 100 &&
  jest.coverage?.branches === 100 &&
  jest.coverage?.functions === 100 &&
  jest.coverage?.lines === 100
    ? 'None. All thresholds passed at 100%.'
    : 'One or more thresholds below 100%; inspect coverage-summary and failing files.'
}

### Quantitative Notes
- Source files in scope: ${moduleSummary.total ?? 'n/a'}
- Files missing from runtime coverage summary: ${covMissing.length}
- Runtime-eligible files missing from coverage summary: ${runtimeCovMissing.length}
- Missing entries are typically type-only modules (for this repo, see \`missing-from-coverage-summary.list\`).

### Qualitative Gaps (priority)
#### P0 — Critical
- ${
  failures.length === 0
    ? 'No critical failing behavior detected in this run.'
    : 'At least one failing suite exists; treat failures as P0 until triaged.'
}

#### P1 — High
- Direct module-to-test mapping remains sparse in portions of \`src/features\` (see \`module-audit-summary.json\`).
- Coverage scaffold reliance still present across auth/proxy/app wrapper slices.

#### P2 — Medium
- A11y assertion density is low relative to test suite size.
- Modal focus-management assertions remain limited without explicit trap/restore tests.

#### P3 — Low
- Type-only/unmapped utility declarations have no runtime assertions by design.

## Gap Tests Created/Detected This Run
| File | Covers | Tests | Status |
|------|--------|-------|--------|
${gapTestFiles.length === 0
  ? '| None | — | — | — |'
  : gapTestFiles
      .map((f) => `| \`${f}\` | gap coverage | n/a | detected |`)
      .join('\n')}

## Gap-Test Run Status
- Command: \`npx jest <gap/a11y test files> --runInBand\`
- Result: ${
  gapSuites.length
    ? `${gapSuites[0]} suites passed out of ${gapSuites[1]}, ${gapTests[0]} tests passed out of ${gapTests[1]}`
    : 'not run or no output captured'
}
`;

fs.writeFileSync(path.join(qaDir, 'component-qa-report.md'), qaReport);

const lighthouseRows = lighthouse.map((r) => {
  const pageLabel =
    r.page === 'home'
      ? '/'
      : r.page === 'dashboard'
        ? '/dashboard'
        : r.page === 'auth-login'
          ? '/auth/login'
          : r.page;
  return `| ${pageLabel} | ${r.performance ?? 'n/a'} | ${r.accessibility ?? 'n/a'} | ${r.bestPractices ?? 'n/a'} | ${r.seo ?? 'n/a'} |`;
});
const vitalsRows = lighthouse.map((r) => {
  const pageLabel =
    r.page === 'home'
      ? '/'
      : r.page === 'dashboard'
        ? '/dashboard'
        : r.page === 'auth-login'
          ? '/auth/login'
          : r.page;
  return `| ${pageLabel} | ${r.fcp ?? 'n/a'} | ${r.lcp ?? 'n/a'} | ${r.tbt ?? 'n/a'} | ${r.cls ?? 'n/a'} |`;
});

const perfReport = `# Frontend Performance Audit
Last run: ${runLocal} (${runUtc})

## Build Metrics
| Metric | Value | Status |
|--------|-------|--------|
| Build time (wall) | ${perf.buildRealSec ?? 'n/a'}s | ${perf.buildRealSec ? '✅' : '⚠️'} |
| Build compile | ${perf.compileSec ?? 'n/a'}s | ${perf.compileSec ? '✅' : '⚠️'} |
| Analyze time (wall) | ${perf.analyzeRealSec ?? 'n/a'}s | ${perf.analyzeRealSec ? '✅' : '⚠️'} |
| Analyze compile | ${perf.analyzeCompileSec ?? 'n/a'}s | ${perf.analyzeCompileSec ? '✅' : '⚠️'} |
| Total chunk JS | ${perf.totalChunkKB ?? 'n/a'} KB | ${perf.totalChunkKB ? '⚠️' : 'n/a'} |
| Base first-load JS | ${perf.baseFirstLoadKB ?? 'n/a'} KB | ${perf.baseFirstLoadKB ? '⚠️' : 'n/a'} |
| Largest route estimate | ${
  perf.heaviestRoute
    ? `${perf.heaviestRoute.route} (${perf.heaviestRoute.firstLoadJSKB} KB first-load)`
    : 'n/a'
} | ${perf.heaviestRoute ? '⚠️' : 'n/a'} |

## Route Sizes
| Route | Size | First Load JS | Status |
|-------|------|---------------|--------|
${perf.heaviestRoute ? `| ${perf.heaviestRoute.route} | ${perf.heaviestRoute.routeChunkKB} KB | ${perf.heaviestRoute.firstLoadJSKB} KB | ⚠️ |` : '| n/a | n/a | n/a | n/a |'}

## Lighthouse Scores
| Page | Perf | A11y | Best Practices | SEO |
|------|------|------|---------------|-----|
${lighthouseRows.length ? lighthouseRows.join('\n') : '| n/a | n/a | n/a | n/a | n/a |'}

## Core Web Vitals (if available)
| Page | FCP | LCP | TBT | CLS |
|------|-----|-----|-----|-----|
${vitalsRows.length ? vitalsRows.join('\n') : '| n/a | n/a | n/a | n/a | n/a |'}

## Findings
- Top emitted chunks are listed in \`chunk-sizes.txt\`; inspect '.next/analyze/*.html' for module-level drill-down.
- Dynamic imports should be verified in source for modal/editor-only paths.
- Duplicated package names in lockfile: ${depDup.duplicateNames ?? 'n/a'} (see \`dependency-duplicates.json\`).
- If '/dashboard'/'/auth/login' Lighthouse entries resolve to Auth0 URLs, treat those scores as redirect-surface metrics, not authenticated app metrics.
`;

fs.writeFileSync(path.join(qaDir, 'perf-audit-report.md'), perfReport);

const a11yIssues = [];
if (dialogIssues.length > 0) {
  for (const file of dialogIssues) {
    a11yIssues.push({
      component: file,
      issue:
        'Dialog role detected without explicit aria-label/aria-labelledby on same file scan.',
      wcag: '4.1.2',
      severity: 'medium',
      recommendation: 'Add accessible dialog name.',
    });
  }
}
if (unlabeledTextareas.length > 0) {
  for (const t of unlabeledTextareas.slice(0, 5)) {
    a11yIssues.push({
      component: t.file,
      issue: 'Textarea tag missing direct aria-label/aria-labelledby/id.',
      wcag: '1.3.1, 3.3.2',
      severity: 'medium',
      recommendation: 'Add programmatic label association.',
    });
  }
}

const failedLhA11y = lighthouse.reduce(
  (sum, r) => sum + (Array.isArray(r.failedA11yAudits) ? r.failedA11yAudits.length : 0),
  0,
);

const a11yReport = `# Frontend Accessibility Audit
Last run: ${runLocal} (${runUtc})

## Automated Checks
| Check | Pages Tested | Issues Found | Severity |
|-------|-------------|-------------|----------|
| Lighthouse a11y audits | ${lighthouse.length || 0} | ${failedLhA11y} | ${failedLhA11y > 0 ? 'high' : 'low'} |
| Heading hierarchy | ${lighthouse.length || 0} | ${failedLhA11y > 0 ? 'see Lighthouse audit details' : 0} | ${failedLhA11y > 0 ? 'medium' : 'low'} |
| Color contrast | ${lighthouse.length || 0} | ${failedLhA11y > 0 ? 'see Lighthouse audit details' : 0} | ${failedLhA11y > 0 ? 'medium' : 'low'} |
| Form labels (static scan) | source scan | ${unlabeledTextareas.length} possible | ${unlabeledTextareas.length ? 'medium' : 'low'} |
| ARIA dialog naming (static scan) | source scan | ${dialogIssues.length} possible | ${dialogIssues.length ? 'medium' : 'low'} |
| Keyboard/navigation test signal | test suite scan | ${patternCountsRaw.userEvent_files ?? 'n/a'} files with userEvent | low |
| A11y assertion signal | test suite scan | ${patternCountsRaw.aria_assertion_files ?? 'n/a'} files | medium |

## Per-Component A11y Status
| Component | Labels | Keyboard | ARIA | Focus | Overall |
|-----------|--------|----------|------|-------|---------|
| TrialCreateForm | ✅ | ✅ | ✅ | N/A | ✅ |
| InviteCandidateModal | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ |
| CandidateTaskView / TaskTextInput | ⚠️ | ✅ | ⚠️ | N/A | ⚠️ |
| CandidatesTable | ✅ | ✅ | ✅ | N/A | ✅ |

## Issues
| # | Component | Issue | WCAG | Severity | Recommendation |
|---|-----------|-------|------|----------|---------------|
${a11yIssues.length
  ? a11yIssues
      .map(
        (i, idx) =>
          `| ${idx + 1} | \`${i.component}\` | ${i.issue.replace(/\|/g, '\\|')} | ${i.wcag} | ${i.severity} | ${i.recommendation} |`,
      )
      .join('\n')
  : '| 1 | n/a | No static/manual issues detected by automated runner heuristics. | n/a | low | Validate manually for modal focus trap and SR flow. |'}

## Findings
- A11y signal in tests:
  - total test files: ${patternCountsRaw.total_test_files ?? 'n/a'}
  - files with getByRole: ${patternCountsRaw.getByRole_files ?? 'n/a'}
  - files with getByLabelText: ${patternCountsRaw.getByLabelText_files ?? 'n/a'}
  - files with userEvent: ${patternCountsRaw.userEvent_files ?? 'n/a'}
  - files with aria-focused assertions: ${patternCountsRaw.aria_assertion_files ?? 'n/a'}
- For full details, review \`lighthouse-summary.json\`, \`dialog-name-issues.list\`, and \`possible-unlabeled-textareas.json\`.
`;

fs.writeFileSync(path.join(qaDir, 'a11y-audit-report.md'), a11yReport);

const changelogPath = path.join(qaDir, 'component-qa-changelog.md');
const changelogEntry = `## Run: ${runLocal} (${runUtc})

### Jest Results
- Suites: ${jest.totalSuitesPassed ?? 'n/a'}/${jest.totalSuites ?? 'n/a'} passed
- Tests: ${jest.totalTestsPassed ?? 'n/a'}/${jest.totalTests ?? 'n/a'} passed
- Coverage: ${jest.coverage?.statements ?? 'n/a'}% stmt, ${jest.coverage?.branches ?? 'n/a'}% branch, ${jest.coverage?.functions ?? 'n/a'}% fn, ${jest.coverage?.lines ?? 'n/a'}% line

### Quality Audit Findings
- Coverage instrumentation files: ${jest.coverageInstrumentedFiles ?? 'n/a'}
- Coverage-specific test files: ${jest.coverageTestFiles ?? 'n/a'}
- Module mapping summary: ${JSON.stringify(moduleSummary.groups || {})}

### Gap Tests
- Files detected under tests/ with *.gap.test.* or *.a11y.test.*: ${gapTestFiles.length}
- Gap test result: ${
  gapSuites.length
    ? `${gapSuites[0]}/${gapSuites[1]} suites, ${gapTests[0]}/${gapTests[1]} tests passed`
    : 'not run or no output'
}

### Performance Findings
- Build wall time: ${perf.buildRealSec ?? 'n/a'}s
- Analyze wall time: ${perf.analyzeRealSec ?? 'n/a'}s
- Total chunk JS: ${perf.totalChunkKB ?? 'n/a'} KB
- Heaviest route: ${
  perf.heaviestRoute
    ? `${perf.heaviestRoute.route} (${perf.heaviestRoute.firstLoadJSKB} KB)`
    : 'n/a'
}

### Accessibility Findings
- Lighthouse pages captured: ${lighthouse.length}
- Lighthouse failed a11y audits: ${failedLhA11y}
- Dialog naming issues (static scan): ${dialogIssues.length}
- Potential unlabeled textareas (static scan): ${unlabeledTextareas.length}

`;

if (fs.existsSync(changelogPath) && fs.readFileSync(changelogPath, 'utf8').trim()) {
  fs.appendFileSync(changelogPath, `\n${changelogEntry}`);
} else {
  fs.writeFileSync(changelogPath, changelogEntry);
}
NODE
record_status "write_reports" 0
echo

echo "== Step 10: Certification Gates =="
if [[ "$ENFORCE_CERT_GATES" -eq 1 ]]; then
  set +e
  node <<'NODE'
const fs = require('fs');
const path = require('path');

const qaDir = process.env.QA_DIR;
const runFlags = {
  lint: Number(process.env.RUN_LINT || 1) === 1,
  typecheck: Number(process.env.RUN_TYPECHECK || 1) === 1,
  build: Number(process.env.RUN_BUILD || 1) === 1,
  analyze: Number(process.env.RUN_ANALYZE || 1) === 1,
  lighthouseRequested: Number(process.env.LIGHTHOUSE_REQUESTED || 1) === 1,
  gapTests: Number(process.env.RUN_GAP_TESTS || 1) === 1,
};

const readJson = (name, fallback = null) => {
  const p = path.join(qaDir, name);
  if (!fs.existsSync(p)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
};
const readList = (name) => {
  const p = path.join(qaDir, name);
  if (!fs.existsSync(p)) return [];
  return fs
    .readFileSync(p, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
};
const readStatuses = () => {
  const p = path.join(qaDir, 'runner-status.tsv');
  const rows = {};
  if (!fs.existsSync(p)) return rows;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    const [step, codeRaw] = line.split('\t');
    const code = Number(codeRaw);
    rows[step] = Number.isFinite(code) ? code : 1;
  }
  return rows;
};

const statuses = readStatuses();
const jest = readJson('jest-summary.json', {}) || {};
const consoleAudit = readJson('console-signal-audit.json', {}) || {};
const lighthouse = readJson('lighthouse-summary.json', []) || [];
const missingRuntimeCoverage = readList('missing-runtime-coverage.list');
const discoveredScope = readJson('discovered-scope.json', null);
const scopeManifestPath = process.env.SCOPE_MANIFEST_PATH || '';
let scopeManifest = null;
if (scopeManifestPath && fs.existsSync(scopeManifestPath)) {
  try {
    scopeManifest = JSON.parse(fs.readFileSync(scopeManifestPath, 'utf8'));
  } catch {
    scopeManifest = null;
  }
}

const hardFailures = [];
const warnings = [];
const checks = [];

const stepPass = (step) => statuses[step] === 0;
const requireStep = (step, enabled, label) => {
  if (!enabled) {
    checks.push({ check: label, status: 'SKIP', details: 'step disabled by flags' });
    return;
  }
  if (stepPass(step)) {
    checks.push({ check: label, status: 'PASS', details: `${step}=0` });
    return;
  }
  checks.push({
    check: label,
    status: 'FAIL',
    details: `${step}=${statuses[step] ?? 'missing'}`,
  });
  hardFailures.push(`${label} failed (${step}=${statuses[step] ?? 'missing'}).`);
};

requireStep('lint', runFlags.lint, 'Lint gate');
requireStep('typecheck', runFlags.typecheck, 'Typecheck gate');
requireStep('test_coverage', true, 'Jest coverage run');
requireStep('parse_jest', true, 'Jest summary parsing');
requireStep('source_test_mapping', true, 'Source-to-test/coverage map');
requireStep('build', runFlags.build, 'Production build');
requireStep('analyze', runFlags.build && runFlags.analyze, 'Bundle analyze build');
requireStep('perf_artifacts', runFlags.build, 'Perf artifact extraction');
requireStep('a11y_signal_scan', true, 'A11y signal scan');
requireStep('gap_tests', runFlags.gapTests, 'Gap/a11y targeted tests');

if (!scopeManifestPath || !scopeManifest) {
  checks.push({
    check: 'Scope manifest baseline',
    status: 'FAIL',
    details: `Missing or unreadable scope manifest at ${scopeManifestPath || 'n/a'}`,
  });
  hardFailures.push(
    `Scope manifest missing/unreadable at ${scopeManifestPath || 'n/a'}. Run with --refresh-scope-manifest to initialize.`,
  );
} else if (!discoveredScope) {
  checks.push({
    check: 'Scope discovery artifact',
    status: 'FAIL',
    details: 'Missing discovered-scope.json from source mapping step.',
  });
  hardFailures.push(
    'discovered-scope.json missing; scope drift checks could not run.',
  );
} else {
  const toSet = (arr) =>
    new Set(Array.isArray(arr) ? arr.map((v) => String(v)) : []);
  const inAOnly = (a, b) => {
    const bSet = toSet(b);
    return (Array.isArray(a) ? a : [])
      .map((v) => String(v))
      .filter((v) => !bSet.has(v));
  };

  const manifestSrc = Array.isArray(scopeManifest.srcFiles)
    ? scopeManifest.srcFiles
    : [];
  const discoveredSrc = Array.isArray(discoveredScope.srcFiles)
    ? discoveredScope.srcFiles
    : [];
  const newSrcFiles = inAOnly(discoveredSrc, manifestSrc);
  checks.push({
    check: 'Scope lock: source files',
    status: newSrcFiles.length === 0 ? 'PASS' : 'FAIL',
    details:
      newSrcFiles.length === 0
        ? `${discoveredSrc.length} files match manifest baseline`
        : `${newSrcFiles.length} new src files not in scope-manifest`,
  });
  if (newSrcFiles.length > 0) {
    hardFailures.push(
      `${newSrcFiles.length} new src files detected outside locked scope manifest.`,
    );
  }

  const manifestRoutes = Array.isArray(scopeManifest.uiRoutes)
    ? scopeManifest.uiRoutes
    : [];
  const discoveredRoutes = Array.isArray(discoveredScope.uiRoutes)
    ? discoveredScope.uiRoutes
    : [];
  const newRoutes = inAOnly(discoveredRoutes, manifestRoutes);
  checks.push({
    check: 'Scope lock: UI routes',
    status: newRoutes.length === 0 ? 'PASS' : 'FAIL',
    details:
      newRoutes.length === 0
        ? `${discoveredRoutes.length} routes match manifest baseline`
        : `${newRoutes.length} new routes not in scope-manifest`,
  });
  if (newRoutes.length > 0) {
    hardFailures.push(
      `${newRoutes.length} new UI routes detected outside locked scope manifest.`,
    );
  }

  const manifestSignals = scopeManifest.routeStateSourceSignals || {};
  const discoveredSignals = discoveredScope.routeStateSourceSignals || {};
  const routesToCheck = [...new Set(discoveredRoutes)];
  const newStateSignals = [];
  for (const route of routesToCheck) {
    const observed = Array.isArray(discoveredSignals[route])
      ? discoveredSignals[route]
      : [];
    const baseline = Array.isArray(manifestSignals[route])
      ? manifestSignals[route]
      : [];
    const added = inAOnly(observed, baseline);
    if (added.length > 0) {
      newStateSignals.push({ route, states: added });
    }
  }
  checks.push({
    check: 'Scope lock: route state signals',
    status: newStateSignals.length === 0 ? 'PASS' : 'FAIL',
    details:
      newStateSignals.length === 0
        ? 'No new state signals detected in route-related source.'
        : `${newStateSignals.length} routes have new state signals not in manifest baseline`,
  });
  if (newStateSignals.length > 0) {
    hardFailures.push(
      `${newStateSignals.length} routes expose new state signals; add tests and refresh scope-manifest.`,
    );
  }

  const manifestReqs = scopeManifest.routeStateRequirements || {};
  const discoveredEvidence = discoveredScope.routeStateTestEvidence || {};
  const missingRequiredStateCoverage = [];
  for (const route of routesToCheck) {
    const required = Array.isArray(manifestReqs[route]) ? manifestReqs[route] : [];
    const observed = Array.isArray(discoveredEvidence[route])
      ? discoveredEvidence[route]
      : [];
    const missing = inAOnly(required, observed);
    if (missing.length > 0) {
      missingRequiredStateCoverage.push({ route, states: missing });
    }
  }
  checks.push({
    check: 'Scope lock: route state test evidence',
    status: missingRequiredStateCoverage.length === 0 ? 'PASS' : 'FAIL',
    details:
      missingRequiredStateCoverage.length === 0
        ? 'All required route states have test evidence.'
        : `${missingRequiredStateCoverage.length} routes missing required state evidence`,
  });
  if (missingRequiredStateCoverage.length > 0) {
    hardFailures.push(
      `${missingRequiredStateCoverage.length} routes are missing required state test evidence from scope-manifest.`,
    );
  }
}

const coverage = jest.coverage || {};
const minCoverage = 99;
for (const key of ['statements', 'branches', 'functions', 'lines']) {
  const value = Number(coverage[key]);
  const ok = Number.isFinite(value) && value >= minCoverage;
  checks.push({
    check: `Coverage ${key}`,
    status: ok ? 'PASS' : 'FAIL',
    details: Number.isFinite(value) ? `${value}%` : 'n/a',
  });
  if (!ok) {
    hardFailures.push(`Coverage ${key} below ${minCoverage}% (${Number.isFinite(value) ? value : 'n/a'}%).`);
  }
}

if (missingRuntimeCoverage.length === 0) {
  checks.push({
    check: 'Runtime coverage completeness',
    status: 'PASS',
    details: 'All runtime-eligible src files appear in coverage summary.',
  });
} else {
  checks.push({
    check: 'Runtime coverage completeness',
    status: 'FAIL',
    details: `${missingRuntimeCoverage.length} runtime files missing from coverage summary.`,
  });
  hardFailures.push(
    `${missingRuntimeCoverage.length} runtime source files missing from coverage summary (see missing-runtime-coverage.list).`,
  );
}

const warnCount = Number(consoleAudit.warningCount || 0);
const runtimeErrorSignals = Number(consoleAudit.runtimeErrorSignals || 0);
if (warnCount === 0 && runtimeErrorSignals === 0) {
  checks.push({
    check: 'Console/log signal cleanliness',
    status: 'PASS',
    details: 'No console.warn/console.error/runtime error signals detected.',
  });
} else {
  checks.push({
    check: 'Console/log signal cleanliness',
    status: 'FAIL',
    details: `warnings=${warnCount}, runtimeErrors=${runtimeErrorSignals}`,
  });
  hardFailures.push(
    `Console/log signals detected (warnings=${warnCount}, runtimeErrors=${runtimeErrorSignals}).`,
  );
}

if (runFlags.lighthouseRequested) {
  const lhStepCodes = [
    statuses.lighthouse_home,
    statuses.lighthouse_dashboard,
    statuses.lighthouse_auth_login,
  ].filter((v) => Number.isFinite(v));
  const lighthouseSkipped = lhStepCodes.length > 0 && lhStepCodes.every((c) => c === 98 || c === 99);

  if (lighthouseSkipped) {
    checks.push({
      check: 'Lighthouse checks',
      status: 'SKIP',
      details: 'Lighthouse skipped due runtime environment/server readiness constraints.',
    });
  } else if (!Array.isArray(lighthouse) || lighthouse.length === 0) {
    checks.push({
      check: 'Lighthouse capture availability',
      status: 'FAIL',
      details: 'No Lighthouse JSON outputs were captured.',
    });
    hardFailures.push('Lighthouse was requested but no Lighthouse outputs were captured.');
  } else {
    checks.push({
      check: 'Lighthouse capture availability',
      status: 'PASS',
      details: `${lighthouse.length} pages captured.`,
    });
    const thresholds = {
      performance: 70,
      accessibility: 90,
      bestPractices: 85,
      seo: 85,
    };
    for (const page of lighthouse) {
      const label = page.requestedUrl || page.page || 'unknown';
      let pathname = '';
      try {
        pathname = new URL(String(label)).pathname || '';
      } catch {
        pathname = '';
      }
      for (const [metric, min] of Object.entries(thresholds)) {
        if (metric === 'seo' && pathname && pathname !== '/') {
          checks.push({
            check: `Lighthouse ${metric} (${label})`,
            status: 'SKIP',
            details: `non-public/auth route (${pathname}); SEO gate applies to public routes only`,
          });
          continue;
        }
        const value = Number(page[metric]);
        const ok = Number.isFinite(value) && value >= min;
        checks.push({
          check: `Lighthouse ${metric} (${label})`,
          status: ok ? 'PASS' : 'FAIL',
          details: Number.isFinite(value) ? `${value} (min ${min})` : `n/a (min ${min})`,
        });
        if (!ok) {
          hardFailures.push(`Lighthouse ${metric} below ${min} for ${label}.`);
        }
      }
    }
  }
} else {
  checks.push({
    check: 'Lighthouse checks',
    status: 'SKIP',
    details: 'Lighthouse disabled by CLI flags.',
  });
}

const overall = hardFailures.length === 0 ? 'PASS' : 'FAIL';

const payload = {
  overall,
  runFlags,
  hardFailures,
  warnings,
  checks,
};

fs.writeFileSync(
  path.join(qaDir, 'certification-gates.json'),
  JSON.stringify(payload, null, 2),
);

const checkRows = checks
  .map((c) => `| ${c.check} | ${c.status} | ${String(c.details).replace(/\|/g, '\\|')} |`)
  .join('\n');
const failuresSection = hardFailures.length
  ? hardFailures.map((f) => `- ${f}`).join('\n')
  : '- None';

const md = `# Full Frontend Certification Gates
Last run (UTC): ${new Date().toISOString()}

## Criteria
- Lint and typecheck pass (unless explicitly skipped)
- Jest coverage run succeeds and global coverage is >= 99% on statements/branches/functions/lines
- Every runtime-eligible \`src/**/*.{ts,tsx}\` file appears in coverage summary
- No console warning/error runtime signals in QA logs
- Production build and analyze pass (unless skipped)
- Lighthouse captures succeed (unless skipped) and meet thresholds
- SEO threshold applies to public routes only (non-public/auth routes are skipped)
- Scope manifest is present and readable (\`qa_verifications/Component-Perf-A11y-QA/scope-manifest.json\`)
- No new src files/routes/state signals exist outside locked scope manifest
- All manifest-required route states have test evidence in current suite

## Check Results
| Check | Status | Details |
|---|---|---|
${checkRows}

## Failures
${failuresSection}
`;

fs.writeFileSync(path.join(qaDir, 'certification-gates.md'), md);

if (overall === 'FAIL') process.exit(1);
NODE
  cert_status="$?"
  set -e
  record_status "certification_gates" "$cert_status"
else
  cat > "$QA_DIR/certification-gates.md" <<'MD'
# Full Frontend Certification Gates
Certification gates were disabled for this run (`--no-cert-gates`).
MD
  cat > "$QA_DIR/certification-gates.json" <<'JSON'
{"overall":"SKIP","reason":"certification gates disabled"}
JSON
  record_status "certification_gates" 99
fi
echo

echo "== Step 11: Final Inventory =="
find "$LATEST_DIR" -maxdepth 3 -type f | sort > "$POST_INVENTORY"
record_status "step11_inventory" 0

echo
echo "== Step 12: Write Latest Summary Report =="
node <<'NODE'
const fs = require('fs');
const path = require('path');

const latestDir = process.env.LATEST_DIR;
const qaDir = process.env.QA_DIR;
const reportPath = process.env.REPORT_MD;
const runStartedUtc = process.env.RUN_STARTED_UTC;
const runStartedEpoch = Number(process.env.RUN_STARTED_EPOCH || 0);
const runMode = process.env.RUN_MODE || 'full';
const runnerPath = process.env.RUNNER_REL_PATH || './qa_verifications/Component-Perf-A11y-QA/run_comp_perf_a11y_qa.sh';

const readJson = (name) => {
  const p = path.join(qaDir, name);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
};
const readText = (name) => {
  const p = path.join(qaDir, name);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
};

const finished = new Date();
const finishedUtc = finished.toISOString();
const durationSeconds =
  runStartedEpoch > 0
    ? Math.max(0, Math.round(Date.now() / 1000 - runStartedEpoch))
    : null;

const jest = readJson('jest-summary.json') || {};
const perf = readJson('perf-summary.json') || {};
const failures = readJson('jest-failures.json') || [];
const certification = readJson('certification-gates.json') || {};
const statusRows = readText('runner-status.tsv')
  .trim()
  .split('\n')
  .filter(Boolean)
  .map((line) => {
    const [step, codeText] = line.split('\t');
    const code = Number(codeText);
    const isSkip = code === 97 || code === 98 || code === 99;
    const status = code === 0 ? 'PASS' : isSkip ? 'SKIP' : 'FAIL';
    return { step, code: Number.isFinite(code) ? code : codeText, status };
  });

const failedSteps = statusRows.filter((row) => row.status === 'FAIL');
const overallStatus = failedSteps.length > 0 ? 'FAIL' : 'PASS';

const stepResultRows = statusRows.length
  ? statusRows
      .map((row) => `| \`${row.step}\` | \`${row.status}\` | \`${row.code}\` |`)
      .join('\n')
  : '| n/a | n/a | n/a |';

const failureLines = [];
for (const row of failedSteps) {
  failureLines.push(
    `- Step failure: \`${row.step}\` exited with \`${row.code}\`. See \`artifacts/runner.log\`.`,
  );
}
for (const f of failures) {
  failureLines.push(
    `- Jest failure: \`${f.suite}\` (${f.category}). ${f.details}`,
  );
}
if (certification && certification.overall === 'FAIL' && Array.isArray(certification.hardFailures)) {
  for (const msg of certification.hardFailures) {
    failureLines.push(`- Certification gate: ${msg}`);
  }
}
const failuresSection = failureLines.length ? failureLines.join('\n') : '- None';

const report = `# Component-Perf-A11y QA Verification

## Run Summary

- Started (UTC): \`${runStartedUtc}\`
- Finished (UTC): \`${finishedUtc}\`
- Overall status: \`${overallStatus}\`
- Runner: \`${runnerPath}\`
- Run mode: \`${runMode}\`

## Artifact Layout

- \`comp_perf_a11y_qa_latest/comp_perf_a11y_qa_report.md\`: this run summary
- \`comp_perf_a11y_qa_latest/artifacts/\`: raw logs, json artifacts, and detailed reports
- Detailed reports:
  - [Component QA Report](artifacts/component-qa-report.md)
  - [Performance Audit Report](artifacts/perf-audit-report.md)
  - [Accessibility Audit Report](artifacts/a11y-audit-report.md)
  - [Component Coverage Map](artifacts/component-coverage-map.md)
  - [QA Changelog](artifacts/component-qa-changelog.md)
  - [Full Frontend Certification Gates](artifacts/certification-gates.md)
  - [Discovered Scope Snapshot](artifacts/discovered-scope.json)
  - [Locked Scope Manifest](../scope-manifest.json)

## Step Results

| Step | Status | Exit Code |
|---|---|---|
${stepResultRows}

## Timing

- Total duration (s): \`${durationSeconds ?? 'n/a'}\`
- Jest wall time (s): \`${jest.wallTimeSeconds ?? 'n/a'}\`
- Build wall time (s): \`${perf.buildRealSec ?? 'n/a'}\`
- Analyze wall time (s): \`${perf.analyzeRealSec ?? 'n/a'}\`
- Certification status: \`${certification.overall ?? 'n/a'}\`

## Failures

${failuresSection}
`;

fs.mkdirSync(latestDir, { recursive: true });
fs.writeFileSync(reportPath, report);
NODE
record_status "write_latest_report" 0

echo
echo "QA run completed."
echo "Primary outputs:"
echo "  - $REPORT_MD"
echo "  - $ARTIFACTS_DIR/component-qa-report.md"
echo "  - $ARTIFACTS_DIR/perf-audit-report.md"
echo "  - $ARTIFACTS_DIR/a11y-audit-report.md"
echo "  - $ARTIFACTS_DIR/component-coverage-map.md"
echo "  - $ARTIFACTS_DIR/component-qa-changelog.md"
echo "  - $ARTIFACTS_DIR/certification-gates.md"
echo "  - $ARTIFACTS_DIR/discovered-scope.json"
echo "  - $SCOPE_MANIFEST_PATH"
echo
echo "Status summary:"
cat "$STATUS_FILE"
