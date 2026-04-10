#!/usr/bin/env bash
set -euo pipefail

# Playwright sets FORCE_COLOR; unset NO_COLOR to prevent Node warning spam
# ("The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.").
unset NO_COLOR || true

usage() {
  cat <<'USAGE'
Usage: run_e2e_flow_qa.sh [options]

Runs the full Frontend E2E Flow QA pass:
  1) Contract validation: tests/e2e/flow-qa/tools/validateContract.mjs
  2) QA suite:           tests/e2e/flow-qa/playwright.config.ts
  3) Baseline suite:     tests/e2e/playwright.config.ts
  4) Integration lane:   tests/e2e/integration-lane/playwright.config.ts

Options:
  --qa-only                     Run only QA E2E Flow suite
  --baseline-only               Run only baseline tests/e2e suite
  --integration-only            Run only live integration suite
  --skip-integration            Skip live integration suite
  --qa-base-url <url>           Set QA_E2E_BASE_URL for QA suite
  --baseline-base-url <url>     Set E2E_BASE_URL for baseline suite
  --backend-root <path>         Backend repo root (default: ../winoe-backend)
  --integration-port <port>     Frontend port for integration lane (default: 3300)
  --with-install                Run Playwright browser install step (default is skip)
  --skip-install                Keep install step skipped (default)
  --enforce-perf-budgets        Export QA_ENFORCE_PERF_BUDGETS=1
  -h, --help                    Show help
USAGE
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
QA_ROOT="$SCRIPT_DIR"
REPO_ROOT="$(cd "$QA_ROOT/../.." && pwd)"
QA_SUITE_ROOT="$REPO_ROOT/tests/e2e/flow-qa"
QA_CONFIG="$QA_SUITE_ROOT/playwright.config.ts"
BASELINE_CONFIG="$REPO_ROOT/tests/e2e/playwright.config.ts"
INTEGRATION_SUITE_ROOT="$REPO_ROOT/tests/e2e/integration-lane"
INTEGRATION_CONFIG="$INTEGRATION_SUITE_ROOT/playwright.config.ts"

LATEST_DIR="$QA_ROOT/e2e_flow_qa_latest"
ARTIFACTS_DIR="$LATEST_DIR/artifacts"
REPORT_MD="$LATEST_DIR/e2e_flow_qa_report.md"
STATUS_TSV="$ARTIFACTS_DIR/step-status.tsv"
RUNNER_REL_PATH="./qa_verifications/E2E-Flow-QA/run_e2e_flow_qa.sh"

QA_SUITE_ARTIFACTS_DIR="$ARTIFACTS_DIR/flow-qa-artifacts"
QA_SUITE_STORAGE_DIR="$ARTIFACTS_DIR/flow-qa-fixtures/storage"
BASELINE_RESULTS_JSON="$ARTIFACTS_DIR/baseline-results.json"
INTEGRATION_ARTIFACTS_DIR="$ARTIFACTS_DIR/integration-artifacts"
INTEGRATION_STORAGE_DIR="$ARTIFACTS_DIR/integration-fixtures/storage"

CONTRACT_VALIDATOR_TOOL="$QA_SUITE_ROOT/tools/validateContract.mjs"
RESULTS_GATE_TOOL="$QA_SUITE_ROOT/tools/checkPlaywrightResults.mjs"
CONTRACT_SUMMARY_JSON="$ARTIFACTS_DIR/flow-qa-contract-summary.json"
QA_GATE_SUMMARY_JSON="$ARTIFACTS_DIR/qa-quality-gate.json"
BASELINE_GATE_SUMMARY_JSON="$ARTIFACTS_DIR/baseline-quality-gate.json"
INTEGRATION_GATE_SUMMARY_JSON="$ARTIFACTS_DIR/integration-quality-gate.json"

BACKEND_ROOT_DEFAULT="$(cd "$REPO_ROOT/.." && pwd)/winoe-backend"
BACKEND_ROOT="${WINOE_BACKEND_REPO_ROOT:-$BACKEND_ROOT_DEFAULT}"
INTEGRATION_FRONTEND_PORT="${E2E_INTEGRATION_FRONTEND_PORT:-3300}"
INTEGRATION_FRONTEND_BASE_URL="${E2E_INTEGRATION_BASE_URL:-http://127.0.0.1:${INTEGRATION_FRONTEND_PORT}}"
INTEGRATION_BACKEND_BASE_URL="${E2E_INTEGRATION_BACKEND_URL:-http://127.0.0.1:8000}"
INTEGRATION_BASE_EXPLICIT=0
if [[ -n "${E2E_INTEGRATION_BASE_URL:-}" ]]; then
  INTEGRATION_BASE_EXPLICIT=1
fi

RUN_QA=1
RUN_BASELINE=1
RUN_INTEGRATION=1
SKIP_INSTALL=1
RUN_MODE="full"
USED_CUSTOM_OPTION=0

QA_SUITE_RAN=0
BASELINE_SUITE_RAN=0
INTEGRATION_SUITE_RAN=0

QA_BASE_URL="${QA_E2E_BASE_URL:-}"
BASELINE_BASE_URL="${E2E_BASE_URL:-}"

MANAGED_BACKEND=0
MANAGED_FRONTEND=0
BACKEND_PID=""
FRONTEND_PID=""

declare -a FAILURES=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --qa-only)
      RUN_QA=1
      RUN_BASELINE=0
      RUN_INTEGRATION=0
      RUN_MODE="qa-only"
      shift
      ;;
    --baseline-only)
      RUN_QA=0
      RUN_BASELINE=1
      RUN_INTEGRATION=0
      RUN_MODE="baseline-only"
      shift
      ;;
    --integration-only)
      RUN_QA=0
      RUN_BASELINE=0
      RUN_INTEGRATION=1
      RUN_MODE="integration-only"
      shift
      ;;
    --skip-integration)
      RUN_INTEGRATION=0
      USED_CUSTOM_OPTION=1
      shift
      ;;
    --qa-base-url)
      QA_BASE_URL="${2:-}"
      USED_CUSTOM_OPTION=1
      shift 2
      ;;
    --baseline-base-url)
      BASELINE_BASE_URL="${2:-}"
      USED_CUSTOM_OPTION=1
      shift 2
      ;;
    --backend-root)
      BACKEND_ROOT="${2:-}"
      USED_CUSTOM_OPTION=1
      shift 2
      ;;
    --integration-port)
      INTEGRATION_FRONTEND_PORT="${2:-}"
      INTEGRATION_FRONTEND_BASE_URL="http://127.0.0.1:${INTEGRATION_FRONTEND_PORT}"
      INTEGRATION_BASE_EXPLICIT=1
      USED_CUSTOM_OPTION=1
      shift 2
      ;;
    --skip-install)
      SKIP_INSTALL=1
      USED_CUSTOM_OPTION=1
      shift
      ;;
    --with-install)
      SKIP_INSTALL=0
      USED_CUSTOM_OPTION=1
      shift
      ;;
    --enforce-perf-budgets)
      export QA_ENFORCE_PERF_BUDGETS=1
      USED_CUSTOM_OPTION=1
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

if [[ "$RUN_QA" -eq 0 && "$RUN_BASELINE" -eq 0 && "$RUN_INTEGRATION" -eq 0 ]]; then
  echo "All suites are disabled; nothing to run." >&2
  exit 2
fi

if [[ "$USED_CUSTOM_OPTION" -eq 1 && "$RUN_MODE" == "full" ]]; then
  RUN_MODE="custom"
elif [[ "$USED_CUSTOM_OPTION" -eq 1 ]]; then
  RUN_MODE="${RUN_MODE}+custom"
fi

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Required command not found: $cmd" >&2
    exit 1
  fi
}

has_env_key() {
  local key="$1"
  local file="$2"
  [[ -f "$file" ]] || return 1
  local value
  value="$(awk -F '=' -v k="$key" '$1 == k { sub(/^[[:space:]]+/, "", $2); sub(/[[:space:]]+$/, "", $2); print $2; exit }' "$file")"
  [[ -n "$value" ]]
}

status_label() {
  local status="$1"
  if [[ "$status" -eq 0 ]]; then
    echo "PASS"
  elif [[ "$status" -eq 99 ]]; then
    echo "SKIP"
  else
    echo "FAIL"
  fi
}

record_status() {
  local step="$1"
  local status="$2"
  local duration="$3"
  printf '%s\t%s\t%s\n' "$step" "$status" "$duration" >> "$STATUS_TSV"
}

run_with_log() {
  local step_key="$1"
  shift
  local log_file="$ARTIFACTS_DIR/${step_key}.log"
  local started
  local finished
  local duration
  local status

  started="$(date +%s)"
  echo "== ${step_key} =="
  set +e
  /usr/bin/time -p "$@" 2>&1 | tee "$log_file"
  status="${PIPESTATUS[0]}"
  set -e
  finished="$(date +%s)"
  duration="$((finished - started))"

  record_status "$step_key" "$status" "$duration"

  if [[ "$status" -eq 0 ]]; then
    echo "[PASS] ${step_key}"
  else
    echo "[FAIL] ${step_key} (exit ${status})"
    FAILURES+=("${step_key} failed (exit ${status}). See artifacts/${step_key}.log")
  fi
  echo
  return "$status"
}

copy_if_exists() {
  local src="$1"
  local dest="$2"
  if [[ -e "$src" ]]; then
    mkdir -p "$dest"
    cp -R "$src" "$dest"
  fi
}

write_report() {
  local finished_utc="$1"
  local overall_status="$2"
  local total_duration="$3"

  {
    echo "# E2E-Flow QA Verification"
    echo
    echo "## Run Summary"
    echo
    echo "- Started (UTC): \`${RUN_STARTED_UTC}\`"
    echo "- Finished (UTC): \`${finished_utc}\`"
    echo "- Overall status: \`${overall_status}\`"
    echo "- Runner: \`${RUNNER_REL_PATH}\`"
    echo "- Run mode: \`${RUN_MODE}\`"
    echo
    echo "## Artifact Layout"
    echo
    echo "- \`e2e_flow_qa_latest/e2e_flow_qa_report.md\`: this run summary"
    echo "- \`e2e_flow_qa_latest/artifacts/\`: raw logs, Playwright outputs, and step status metadata"
    echo "- Common files in artifacts:"
    echo "  - \`step-status.tsv\`"
    echo "  - \`playwright-install.log\` (when install step runs)"
    echo "  - \`validate-contract.log\` (if QA suite ran)"
    echo "  - \`qa-suite.log\` + \`qa-quality-gate.log\` (if QA suite ran)"
    echo "  - \`baseline-suite.log\` + \`baseline-quality-gate.log\` (if baseline suite ran)"
    echo "  - \`integration-*.log\` + \`integration-quality-gate.log\` (if integration suite ran)"
    echo "  - \`flow-qa-contract-summary.json\`"
    echo "  - \`qa-quality-gate.json\`, \`baseline-quality-gate.json\`, \`integration-quality-gate.json\`"
    echo "  - \`flow-qa-artifacts/\`, \`integration-artifacts/\`"
    echo "  - \`flow-qa-fixtures/storage/\`, \`integration-fixtures/storage/\`"
    echo
    echo "## Step Results"
    echo
    echo "| Step | Status | Exit Code |"
    echo "|---|---|---|"

    if [[ -f "$STATUS_TSV" ]]; then
      while IFS=$'\t' read -r step status duration; do
        local label
        label="$(status_label "$status")"
        echo "| \`${step}\` | \`${label}\` | \`${status}\` |"
      done < "$STATUS_TSV"
    fi

    echo
    echo "## Timing"
    echo
    echo "- Total duration (s): \`${total_duration}\`"

    if [[ -f "$STATUS_TSV" ]]; then
      while IFS=$'\t' read -r step status duration; do
        echo "- ${step} wall time (s): \`${duration}\`"
      done < "$STATUS_TSV"
    fi

    echo
    echo "## Failures"
    echo

    if [[ "${#FAILURES[@]}" -eq 0 ]]; then
      echo "- None"
    else
      local failure
      for failure in "${FAILURES[@]}"; do
        echo "- ${failure}"
      done
    fi
  } > "$REPORT_MD"
}

is_http_ok() {
  local url="$1"
  curl -fsS "$url" >/dev/null 2>&1
}

detect_running_frontend_base() {
  local -a candidates=()
  if [[ -n "${QA_BASE_URL:-}" ]]; then
    candidates+=("${QA_BASE_URL}")
  fi
  if [[ -n "${BASELINE_BASE_URL:-}" ]]; then
    candidates+=("${BASELINE_BASE_URL}")
  fi
  candidates+=("${INTEGRATION_FRONTEND_BASE_URL}")
  candidates+=("http://127.0.0.1:3200")
  candidates+=("http://127.0.0.1:3000")
  local candidate
  for candidate in "${candidates[@]}"; do
    if is_http_ok "${candidate}/api/health"; then
      echo "$candidate"
      return 0
    fi
  done
  return 1
}

cleanup_servers() {
  if [[ "$MANAGED_FRONTEND" -eq 1 && -n "$FRONTEND_PID" ]]; then
    if kill -0 "$FRONTEND_PID" >/dev/null 2>&1; then
      kill "$FRONTEND_PID" >/dev/null 2>&1 || true
      wait "$FRONTEND_PID" >/dev/null 2>&1 || true
    fi
  fi
  if [[ "$MANAGED_BACKEND" -eq 1 && -n "$BACKEND_PID" ]]; then
    if kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
      kill "$BACKEND_PID" >/dev/null 2>&1 || true
      wait "$BACKEND_PID" >/dev/null 2>&1 || true
    fi
  fi
}
trap cleanup_servers EXIT

require_cmd npm
require_cmd npx
require_cmd node
require_cmd curl

RUN_STARTED_UTC="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
RUN_STARTED_EPOCH="$(date +%s)"

PREVIOUS_INVENTORY_TMP="$(mktemp)"
if [[ -d "$LATEST_DIR" ]]; then
  find "$LATEST_DIR" -maxdepth 4 -type f | sort > "$PREVIOUS_INVENTORY_TMP"
fi

rm -rf "$LATEST_DIR"
mkdir -p "$ARTIFACTS_DIR"
: > "$STATUS_TSV"

if [[ -s "$PREVIOUS_INVENTORY_TMP" ]]; then
  cp "$PREVIOUS_INVENTORY_TMP" "$ARTIFACTS_DIR/pre-run-inventory.txt"
else
  : > "$ARTIFACTS_DIR/pre-run-inventory.txt"
fi
rm -f "$PREVIOUS_INVENTORY_TMP"

record_status "step0_inventory" 0 0

cd "$REPO_ROOT"

# If a frontend is already running, reuse it for QA and baseline suites by default.
# This avoids Next.js lock contention when users start servers manually.
if [[ "$RUN_QA" -eq 1 || "$RUN_BASELINE" -eq 1 ]]; then
  if [[ -z "$QA_BASE_URL" || -z "$BASELINE_BASE_URL" ]]; then
    if detected_frontend_base="$(detect_running_frontend_base)"; then
      if [[ -z "$QA_BASE_URL" && "$RUN_QA" -eq 1 ]]; then
        QA_BASE_URL="$detected_frontend_base"
      fi
      if [[ -z "$BASELINE_BASE_URL" && "$RUN_BASELINE" -eq 1 ]]; then
        BASELINE_BASE_URL="$detected_frontend_base"
      fi
      if [[ "$RUN_INTEGRATION" -eq 1 && "$INTEGRATION_BASE_EXPLICIT" -eq 0 ]]; then
        INTEGRATION_FRONTEND_BASE_URL="$detected_frontend_base"
        if [[ "$detected_frontend_base" =~ :([0-9]+)($|/) ]]; then
          INTEGRATION_FRONTEND_PORT="${BASH_REMATCH[1]}"
        fi
      fi
      echo "Detected running frontend at ${detected_frontend_base}; reusing for QA/baseline where base URL is unset."
    fi
  fi
fi

echo "Frontend E2E Flow QA Runner"
echo "Started (UTC): $RUN_STARTED_UTC"
echo "Run mode: $RUN_MODE"
echo "Artifacts dir: $ARTIFACTS_DIR"
echo

PREFLIGHT_STATUS=0
PREFLIGHT_LOG="$ARTIFACTS_DIR/preflight.log"
: > "$PREFLIGHT_LOG"

if [[ "$RUN_QA" -eq 1 && ! -f "$QA_CONFIG" ]]; then
  echo "Missing QA Playwright config: $QA_CONFIG" | tee -a "$PREFLIGHT_LOG"
  PREFLIGHT_STATUS=1
fi
if [[ "$RUN_BASELINE" -eq 1 && ! -f "$BASELINE_CONFIG" ]]; then
  echo "Missing baseline Playwright config: $BASELINE_CONFIG" | tee -a "$PREFLIGHT_LOG"
  PREFLIGHT_STATUS=1
fi
if [[ "$RUN_INTEGRATION" -eq 1 && ! -f "$INTEGRATION_CONFIG" ]]; then
  echo "Missing integration Playwright config: $INTEGRATION_CONFIG" | tee -a "$PREFLIGHT_LOG"
  PREFLIGHT_STATUS=1
fi
if [[ "$RUN_QA" -eq 1 && ! -f "$CONTRACT_VALIDATOR_TOOL" ]]; then
  echo "Missing contract validator tool: $CONTRACT_VALIDATOR_TOOL" | tee -a "$PREFLIGHT_LOG"
  PREFLIGHT_STATUS=1
fi
if [[ ! -f "$RESULTS_GATE_TOOL" ]]; then
  echo "Missing results gate tool: $RESULTS_GATE_TOOL" | tee -a "$PREFLIGHT_LOG"
  PREFLIGHT_STATUS=1
fi
if [[ "$RUN_INTEGRATION" -eq 1 && ! -d "$BACKEND_ROOT" ]]; then
  echo "Missing backend root directory: $BACKEND_ROOT" | tee -a "$PREFLIGHT_LOG"
  PREFLIGHT_STATUS=1
fi
if [[ "$RUN_INTEGRATION" -eq 1 && ! -x "$BACKEND_ROOT/runBackend.sh" ]]; then
  echo "Missing executable backend runner: $BACKEND_ROOT/runBackend.sh" | tee -a "$PREFLIGHT_LOG"
  PREFLIGHT_STATUS=1
fi
if [[ -z "${WINOE_AUTH0_SECRET:-}" ]] && ! has_env_key "WINOE_AUTH0_SECRET" "$REPO_ROOT/.env.local"; then
  echo "WINOE_AUTH0_SECRET is required for Playwright global setup (env or .env.local)." | tee -a "$PREFLIGHT_LOG"
  PREFLIGHT_STATUS=1
fi

record_status "preflight" "$PREFLIGHT_STATUS" 0
if [[ "$PREFLIGHT_STATUS" -ne 0 ]]; then
  FAILURES+=("Preflight checks failed. See artifacts/preflight.log")
fi

if [[ "$SKIP_INSTALL" -eq 0 && "$PREFLIGHT_STATUS" -eq 0 ]]; then
  run_with_log "playwright-install" npx playwright install --with-deps
else
  record_status "playwright-install" 99 0
fi

SHARED_FRONTEND_PREP_OK=1
if [[ "$PREFLIGHT_STATUS" -eq 0 && ( "$RUN_QA" -eq 1 || "$RUN_BASELINE" -eq 1 ) ]]; then
  if [[ -z "$QA_BASE_URL" || -z "$BASELINE_BASE_URL" ]]; then
    if detected_frontend_base="$(detect_running_frontend_base)"; then
      if [[ -z "$QA_BASE_URL" && "$RUN_QA" -eq 1 ]]; then
        QA_BASE_URL="$detected_frontend_base"
      fi
      if [[ -z "$BASELINE_BASE_URL" && "$RUN_BASELINE" -eq 1 ]]; then
        BASELINE_BASE_URL="$detected_frontend_base"
      fi
      if [[ "$RUN_INTEGRATION" -eq 1 && "$INTEGRATION_BASE_EXPLICIT" -eq 0 ]]; then
        INTEGRATION_FRONTEND_BASE_URL="$detected_frontend_base"
        if [[ "$detected_frontend_base" =~ :([0-9]+)($|/) ]]; then
          INTEGRATION_FRONTEND_PORT="${BASH_REMATCH[1]}"
        fi
      fi
      echo "Detected running frontend at ${detected_frontend_base}; reusing for QA/baseline where base URL is unset."
    else
      step_key="shared-start-frontend"
      frontend_log="$ARTIFACTS_DIR/${step_key}.log"
      started="$(date +%s)"
      echo "== ${step_key} =="
      set +e
      (
        cd "$REPO_ROOT"
        WINOE_BACKEND_BASE_URL="$INTEGRATION_BACKEND_BASE_URL" \
        WINOE_APP_BASE_URL="$INTEGRATION_FRONTEND_BASE_URL" \
        NEXT_PUBLIC_WINOE_APP_BASE_URL="$INTEGRATION_FRONTEND_BASE_URL" \
        npm run dev -- -p "$INTEGRATION_FRONTEND_PORT"
      ) > "$frontend_log" 2>&1 &
      FRONTEND_PID="$!"
      status="$?"
      set -e
      sleep 1
      if [[ "$status" -eq 0 ]] && ! kill -0 "$FRONTEND_PID" >/dev/null 2>&1; then
        status=1
      fi
      finished="$(date +%s)"
      duration="$((finished - started))"
      record_status "$step_key" "$status" "$duration"
      if [[ "$status" -eq 0 ]]; then
        MANAGED_FRONTEND=1
        echo "[PASS] ${step_key} (pid ${FRONTEND_PID})"
      else
        echo "[FAIL] ${step_key}"
        FAILURES+=("${step_key} failed. See artifacts/${step_key}.log")
        SHARED_FRONTEND_PREP_OK=0
      fi
      echo

      if [[ "$SHARED_FRONTEND_PREP_OK" -eq 1 ]]; then
        if run_with_log \
          "shared-wait-frontend" \
          bash -lc "for i in {1..90}; do curl -fsS '${INTEGRATION_FRONTEND_BASE_URL}/api/health' >/dev/null && exit 0; kill -0 '${FRONTEND_PID}' >/dev/null 2>&1 || { echo 'Frontend process exited before health ready'; exit 1; }; sleep 2; done; echo 'Frontend health check timed out'; exit 1"; then
          :
        else
          SHARED_FRONTEND_PREP_OK=0
        fi
      fi

      if [[ "$SHARED_FRONTEND_PREP_OK" -eq 1 ]]; then
        if [[ -z "$QA_BASE_URL" && "$RUN_QA" -eq 1 ]]; then
          QA_BASE_URL="$INTEGRATION_FRONTEND_BASE_URL"
        fi
        if [[ -z "$BASELINE_BASE_URL" && "$RUN_BASELINE" -eq 1 ]]; then
          BASELINE_BASE_URL="$INTEGRATION_FRONTEND_BASE_URL"
        fi
      fi
    fi
  fi
fi

if [[ "$RUN_QA" -eq 1 && "$PREFLIGHT_STATUS" -eq 0 && "$SHARED_FRONTEND_PREP_OK" -eq 1 ]]; then
  mkdir -p "$QA_SUITE_ARTIFACTS_DIR" "$QA_SUITE_STORAGE_DIR"
  if [[ -n "$QA_BASE_URL" ]]; then
    export QA_E2E_BASE_URL="$QA_BASE_URL"
  fi
  export QA_E2E_ARTIFACTS_DIR="$QA_SUITE_ARTIFACTS_DIR"
  export QA_E2E_STORAGE_DIR="$QA_SUITE_STORAGE_DIR"

  run_with_log \
    "validate-contract" \
    env FLOW_QA_CONTRACT_SUMMARY_PATH="$CONTRACT_SUMMARY_JSON" \
    node "$CONTRACT_VALIDATOR_TOOL"

  if run_with_log "qa-suite" npx playwright test -c "$QA_CONFIG"; then
    QA_SUITE_RAN=1
  else
    QA_SUITE_RAN=1
  fi

  if [[ -f "$QA_SUITE_ARTIFACTS_DIR/results.json" ]]; then
    run_with_log \
      "qa-quality-gate" \
      node "$RESULTS_GATE_TOOL" \
      --file "$QA_SUITE_ARTIFACTS_DIR/results.json" \
      --label "qa-suite" \
      --max-unexpected 0 \
      --max-flaky 0 \
      --max-skipped 0 \
      --output "$QA_GATE_SUMMARY_JSON"
  else
    record_status "qa-quality-gate" 99 0
  fi
else
  if [[ "$RUN_QA" -eq 1 ]]; then
    record_status "validate-contract" 99 0
    record_status "qa-suite" 99 0
    record_status "qa-quality-gate" 99 0
  fi
fi

if [[ "$RUN_BASELINE" -eq 1 && "$PREFLIGHT_STATUS" -eq 0 && "$SHARED_FRONTEND_PREP_OK" -eq 1 ]]; then
  if [[ -n "$BASELINE_BASE_URL" ]]; then
    export E2E_BASE_URL="$BASELINE_BASE_URL"
  fi

  if run_with_log \
    "baseline-suite" \
    env E2E_BASELINE_RESULTS_JSON="$BASELINE_RESULTS_JSON" \
    npx playwright test -c "$BASELINE_CONFIG"; then
    BASELINE_SUITE_RAN=1
  else
    BASELINE_SUITE_RAN=1
  fi

  if [[ -f "$BASELINE_RESULTS_JSON" ]]; then
    run_with_log \
      "baseline-quality-gate" \
      node "$RESULTS_GATE_TOOL" \
      --file "$BASELINE_RESULTS_JSON" \
      --label "baseline-suite" \
      --max-unexpected 0 \
      --max-flaky 0 \
      --max-skipped 0 \
      --output "$BASELINE_GATE_SUMMARY_JSON"
  else
    record_status "baseline-quality-gate" 99 0
  fi
else
  if [[ "$RUN_BASELINE" -eq 1 ]]; then
    record_status "baseline-suite" 99 0
    record_status "baseline-quality-gate" 99 0
  fi
fi

if [[ "$RUN_INTEGRATION" -eq 1 && "$PREFLIGHT_STATUS" -eq 0 ]]; then
  mkdir -p "$INTEGRATION_ARTIFACTS_DIR" "$INTEGRATION_STORAGE_DIR"

  # Step: backend migrate (only when we manage backend startup)
  if is_http_ok "${INTEGRATION_BACKEND_BASE_URL}/health"; then
    echo "Reusing existing backend at ${INTEGRATION_BACKEND_BASE_URL}"
    record_status "integration-backend-migrate" 99 0
    record_status "integration-start-backend" 99 0
  else
    if run_with_log \
      "integration-backend-migrate" \
      bash -lc "cd '$BACKEND_ROOT' && ENV=local WINOE_ENV=local DEV_AUTH_BYPASS=1 ./runBackend.sh migrate"; then
      step_key="integration-start-backend"
      backend_log="$ARTIFACTS_DIR/${step_key}.log"
      started="$(date +%s)"
      echo "== ${step_key} =="
      set +e
      (
        cd "$BACKEND_ROOT"
        ENV=local WINOE_ENV=local DEV_AUTH_BYPASS=1 DISABLE_RELOAD=1 ./runBackend.sh
      ) > "$backend_log" 2>&1 &
      BACKEND_PID="$!"
      status="$?"
      set -e
      sleep 1
      if [[ "$status" -eq 0 ]] && ! kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
        status=1
      fi
      finished="$(date +%s)"
      duration="$((finished - started))"
      record_status "$step_key" "$status" "$duration"
      if [[ "$status" -eq 0 ]]; then
        MANAGED_BACKEND=1
        echo "[PASS] ${step_key} (pid ${BACKEND_PID})"
      else
        echo "[FAIL] ${step_key}"
        FAILURES+=("${step_key} failed. See artifacts/${step_key}.log")
      fi
      echo
    else
      record_status "integration-start-backend" 99 0
    fi
  fi

  if run_with_log \
    "integration-wait-backend" \
    bash -lc "for i in {1..60}; do curl -fsS '${INTEGRATION_BACKEND_BASE_URL}/health' >/dev/null && exit 0; sleep 2; done; echo 'Backend health check timed out'; exit 1"; then
    :
  else
    record_status "integration-start-frontend" 99 0
    record_status "integration-wait-frontend" 99 0
    record_status "integration-suite" 99 0
    record_status "integration-quality-gate" 99 0
  fi

  if [[ $(grep -c '^integration-wait-backend\t0\t' "$STATUS_TSV" || true) -gt 0 ]]; then
    if is_http_ok "${INTEGRATION_FRONTEND_BASE_URL}/api/health"; then
      echo "Reusing existing frontend at ${INTEGRATION_FRONTEND_BASE_URL}"
      record_status "integration-start-frontend" 99 0
    else
      step_key="integration-start-frontend"
      frontend_log="$ARTIFACTS_DIR/${step_key}.log"
      started="$(date +%s)"
      echo "== ${step_key} =="
      set +e
      (
        cd "$REPO_ROOT"
        WINOE_BACKEND_BASE_URL="$INTEGRATION_BACKEND_BASE_URL" \
        WINOE_APP_BASE_URL="$INTEGRATION_FRONTEND_BASE_URL" \
        NEXT_PUBLIC_WINOE_APP_BASE_URL="$INTEGRATION_FRONTEND_BASE_URL" \
        npm run dev -- -p "$INTEGRATION_FRONTEND_PORT"
      ) > "$frontend_log" 2>&1 &
      FRONTEND_PID="$!"
      status="$?"
      set -e
      sleep 1
      if [[ "$status" -eq 0 ]] && ! kill -0 "$FRONTEND_PID" >/dev/null 2>&1; then
        status=1
      fi
      finished="$(date +%s)"
      duration="$((finished - started))"
      record_status "$step_key" "$status" "$duration"
      if [[ "$status" -eq 0 ]]; then
        MANAGED_FRONTEND=1
        echo "[PASS] ${step_key} (pid ${FRONTEND_PID})"
      else
        echo "[FAIL] ${step_key}"
        FAILURES+=("${step_key} failed. See artifacts/${step_key}.log")
      fi
      echo
    fi

    if [[ "$MANAGED_FRONTEND" -eq 1 && -n "$FRONTEND_PID" ]]; then
      integration_wait_cmd="for i in {1..90}; do curl -fsS '${INTEGRATION_FRONTEND_BASE_URL}/api/health' >/dev/null && exit 0; kill -0 '${FRONTEND_PID}' >/dev/null 2>&1 || { echo 'Frontend process exited before health ready'; exit 1; }; sleep 2; done; echo 'Frontend health check timed out'; exit 1"
    else
      integration_wait_cmd="for i in {1..90}; do curl -fsS '${INTEGRATION_FRONTEND_BASE_URL}/api/health' >/dev/null && exit 0; sleep 2; done; echo 'Frontend health check timed out'; exit 1"
    fi

    if run_with_log \
      "integration-wait-frontend" \
      bash -lc "${integration_wait_cmd}"; then
      if run_with_log \
        "integration-suite" \
        env \
          E2E_INTEGRATION_BASE_URL="$INTEGRATION_FRONTEND_BASE_URL" \
          E2E_INTEGRATION_ARTIFACTS_DIR="$INTEGRATION_ARTIFACTS_DIR" \
          QA_E2E_STORAGE_DIR="$INTEGRATION_STORAGE_DIR" \
          QA_E2E_TALENT_PARTNER_EMAIL="${QA_E2E_TALENT_PARTNER_EMAIL:-talent_partner1@local.test}" \
          QA_E2E_CANDIDATE_EMAIL="${QA_E2E_CANDIDATE_EMAIL:-candidate1@local.test}" \
          npx playwright test -c "$INTEGRATION_CONFIG"; then
        INTEGRATION_SUITE_RAN=1
      else
        INTEGRATION_SUITE_RAN=1
      fi

      if [[ -f "$INTEGRATION_ARTIFACTS_DIR/results.json" ]]; then
        run_with_log \
          "integration-quality-gate" \
          node "$RESULTS_GATE_TOOL" \
          --file "$INTEGRATION_ARTIFACTS_DIR/results.json" \
          --label "integration-suite" \
          --max-unexpected 0 \
          --max-flaky 0 \
          --max-skipped 0 \
          --output "$INTEGRATION_GATE_SUMMARY_JSON"
      else
        record_status "integration-quality-gate" 99 0
      fi
    else
      record_status "integration-suite" 99 0
      record_status "integration-quality-gate" 99 0
    fi
  fi
else
  if [[ "$RUN_INTEGRATION" -eq 1 ]]; then
    record_status "integration-backend-migrate" 99 0
    record_status "integration-start-backend" 99 0
    record_status "integration-wait-backend" 99 0
    record_status "integration-start-frontend" 99 0
    record_status "integration-wait-frontend" 99 0
    record_status "integration-suite" 99 0
    record_status "integration-quality-gate" 99 0
  fi
fi

if [[ "$BASELINE_SUITE_RAN" -eq 1 ]]; then
  copy_if_exists "$REPO_ROOT/test-results" "$ARTIFACTS_DIR/baseline-test-results"
fi
record_status "collect_artifacts" 0 0

if [[ "$QA_SUITE_RAN" -eq 1 && -f "$QA_SUITE_ARTIFACTS_DIR/results.json" ]]; then
  node -e '
const fs = require("fs");
const input = process.argv[1];
const output = process.argv[2];
try {
  const data = JSON.parse(fs.readFileSync(input, "utf8"));
  const stats = data.stats || {};
  fs.writeFileSync(output, JSON.stringify({
    expected: stats.expected ?? null,
    skipped: stats.skipped ?? null,
    unexpected: stats.unexpected ?? null,
    flaky: stats.flaky ?? null,
    duration_ms: Number.isFinite(stats.duration) ? Math.round(stats.duration) : null,
  }, null, 2));
} catch (err) {
  fs.writeFileSync(output, JSON.stringify({ error: String(err) }, null, 2));
}
' "$QA_SUITE_ARTIFACTS_DIR/results.json" "$ARTIFACTS_DIR/qa-suite-summary.json"
  record_status "parse_qa_summary" 0 0
else
  record_status "parse_qa_summary" 99 0
fi

RUN_FINISHED_UTC="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
RUN_FINISHED_EPOCH="$(date +%s)"
TOTAL_DURATION="$((RUN_FINISHED_EPOCH - RUN_STARTED_EPOCH))"

OVERALL_STATUS="PASS"
while IFS=$'\t' read -r step status duration; do
  if [[ "$status" -ne 0 && "$status" -ne 99 ]]; then
    OVERALL_STATUS="FAIL"
    break
  fi
done < "$STATUS_TSV"

if [[ "$OVERALL_STATUS" == "FAIL" && "${#FAILURES[@]}" -eq 0 ]]; then
  FAILURES+=("At least one step failed. Review artifacts/step-status.tsv and step logs.")
fi

write_report "$RUN_FINISHED_UTC" "$OVERALL_STATUS" "$TOTAL_DURATION"
record_status "write_report" 0 0

find "$LATEST_DIR" -maxdepth 4 -type f | sort > "$ARTIFACTS_DIR/post-run-inventory.txt"

cat "$REPORT_MD"

echo
if [[ "$OVERALL_STATUS" == "PASS" ]]; then
  echo "E2E Flow QA completed successfully."
  echo "Report: $REPORT_MD"
  exit 0
fi

echo "E2E Flow QA completed with failures."
echo "Report: $REPORT_MD"
exit 1
