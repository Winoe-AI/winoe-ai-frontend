#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
QA_ROOT="$SCRIPT_DIR"
REPO_ROOT="$(cd "$QA_ROOT/../.." && pwd)"
BACKEND_DIR="$REPO_ROOT/../winoe-backend"
FRONTEND_ENV_FILE="$REPO_ROOT/.env.local"
BACKEND_ENV_FILE="$BACKEND_DIR/.env"
LATEST_DIR="$QA_ROOT/contract_live_qa_latest"
REPORT_MD="$LATEST_DIR/contract_live_qa_report.md"
TIMESTAMP="${CONTRACT_LIVE_TIMESTAMP:-$(date +%Y%m%dT%H%M%S)}"
ARTIFACTS_ROOT="${CONTRACT_LIVE_ARTIFACTS_ROOT:-$LATEST_DIR/artifacts}"
EVIDENCE_DIR="${CONTRACT_LIVE_ARTIFACTS_DIR:-$ARTIFACTS_ROOT/$TIMESTAMP}"
STORAGE_DIR="${QA_E2E_STORAGE_DIR:-$EVIDENCE_DIR/storage}"
DRIVER_SEQUENCE_RAW="${CONTRACT_LIVE_DRIVER_SEQUENCE:-talent_partner-fresh}"
SKIP_DRIVER="${CONTRACT_LIVE_SKIP_DRIVER:-0}"
RUNNER_STATUS_FILE="$ARTIFACTS_ROOT/runner-status.tsv"
RUNNER_LOG="$ARTIFACTS_ROOT/runner.log"
PRE_INVENTORY="$ARTIFACTS_ROOT/pre-run-inventory.txt"
POST_INVENTORY="$ARTIFACTS_ROOT/post-run-inventory.txt"
LATEST_RUN_FILE="$ARTIFACTS_ROOT/latest-run.txt"
RUNNER_REL_PATH="./qa_verifications/Contract-Live-QA/run_contract_live.sh"
RUN_STARTED_UTC="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
RUN_STARTED_EPOCH="$(date +%s)"
OVERALL_STATUS="PASS"
declare -a FAILURES=()

mkdir -p "$ARTIFACTS_ROOT" "$EVIDENCE_DIR" "$STORAGE_DIR"

# Load only the local QA env files. This preserves space-containing values like
# WINOE_AUTH0_SCOPE without relying on `source`-ing raw env files.
source "$SCRIPT_DIR/contract_live_env.sh"
load_contract_live_local_env "$FRONTEND_ENV_FILE" "$BACKEND_ENV_FILE"

export CONTRACT_LIVE_TIMESTAMP="$TIMESTAMP"
export CONTRACT_LIVE_ARTIFACTS_DIR="$EVIDENCE_DIR"
export QA_E2E_STORAGE_DIR="$STORAGE_DIR"
export CONTRACT_LIVE_BASE_URL="${CONTRACT_LIVE_BASE_URL:-http://localhost:3000}"
export CONTRACT_LIVE_SCENARIO_GENERATION_RUNTIME_MODE="${CONTRACT_LIVE_SCENARIO_GENERATION_RUNTIME_MODE:-demo}"
export WINOE_EMAIL_PROVIDER="${WINOE_EMAIL_PROVIDER:-console}"
STACK_BOOTSTRAP_PID=""
STACK_BOOTSTRAP_LOG="$ARTIFACTS_ROOT/stack-bootstrap.log"

start_clean_local_stack() {
  if [[ -n "${STACK_BOOTSTRAP_PID:-}" ]] && kill -0 "$STACK_BOOTSTRAP_PID" >/dev/null 2>&1; then
    return 0
  fi

  echo "Bootstrapping clean local stack with run_contract_live_stack.sh" | tee -a "$RUNNER_LOG"
  bash "$QA_ROOT/run_contract_live_stack.sh" >"$STACK_BOOTSTRAP_LOG" 2>&1 &
  STACK_BOOTSTRAP_PID=$!
  echo "$STACK_BOOTSTRAP_PID" >"$ARTIFACTS_ROOT/stack-bootstrap.pid"
}

wait_for_http_ready() {
  local url="$1"
  local label="$2"
  local deadline=$((SECONDS + 180))
  local port="${url##*:}"
  port="${port%%/*}"
  while (( SECONDS < deadline )); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    if [[ -n "${STACK_BOOTSTRAP_PID:-}" ]] && ! kill -0 "$STACK_BOOTSTRAP_PID" >/dev/null 2>&1; then
      {
        echo "${label} stack bootstrap exited before ${url} became ready."
        echo "Bootstrap log: ${STACK_BOOTSTRAP_LOG}"
        if [[ -f "$STACK_BOOTSTRAP_LOG" ]]; then
          echo "--- stack bootstrap log tail ---"
          tail -n 80 "$STACK_BOOTSTRAP_LOG"
          echo "--- end stack bootstrap log tail ---"
        fi
      } >&2
      exit 1
    fi
    sleep 2
  done

  local listener_info=""
  if command -v lsof >/dev/null 2>&1; then
    local pids
    mapfile -t pids < <(lsof -nP -ti tcp:"$port" 2>/dev/null | sort -u)
    if [[ "${#pids[@]}" -gt 0 ]]; then
      local pid command_line
      for pid in "${pids[@]}"; do
        command_line="$(ps -p "$pid" -o command= 2>/dev/null | xargs || true)"
        listener_info+=$'\n'"- PID ${pid}: ${command_line:-<unknown>}"
      done
    fi
  fi

  {
    echo "${label} is not responding at ${url}."
    if [[ -n "$listener_info" ]]; then
      echo "Listening processes:"
      echo "$listener_info"
    else
      echo "No process is listening on port ${port}."
    fi
    if [[ -f "$STACK_BOOTSTRAP_LOG" ]]; then
      echo "Bootstrap log: ${STACK_BOOTSTRAP_LOG}"
      echo "--- stack bootstrap log tail ---"
      tail -n 80 "$STACK_BOOTSTRAP_LOG"
      echo "--- end stack bootstrap log tail ---"
    fi
  } >&2
  exit 1
}

auth_login_preflight() {
  local label="$1"
  local url="$2"
  local headers_file
  local body_file
  headers_file="$(mktemp "$ARTIFACTS_ROOT/${label,,}-auth-headers.XXXXXX")"
  body_file="$(mktemp "$ARTIFACTS_ROOT/${label,,}-auth-body.XXXXXX")"
  local status_code
  status_code="$(curl -sS -D "$headers_file" -o "$body_file" -w '%{http_code}' "$url" || true)"

  local evidence_file="$EVIDENCE_DIR/${label}-auth-preflight.txt"
  {
    echo "URL: $url"
    echo "Status: ${status_code:-<empty>}"
    echo "--- headers ---"
    cat "$headers_file"
    echo "--- body (first 120 lines) ---"
    sed -n '1,120p' "$body_file"
  } >"$evidence_file"

  rm -f "$headers_file" "$body_file"

  if [[ ! "$status_code" =~ ^[23][0-9][0-9]$ ]]; then
    {
      echo "${label} auth preflight failed for ${url}."
      echo "Expected a 2xx or 3xx response, got ${status_code:-<empty>}."
      echo "Evidence: ${evidence_file}"
    } >&2
    exit 1
  fi
}

cleanup_stack_bootstrap() {
  local exit_code=$?
  if [[ -n "${STACK_BOOTSTRAP_PID:-}" ]]; then
    kill "$STACK_BOOTSTRAP_PID" >/dev/null 2>&1 || true
    wait "$STACK_BOOTSTRAP_PID" >/dev/null 2>&1 || true
  fi
  exit "$exit_code"
}
trap cleanup_stack_bootstrap EXIT INT TERM

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
  printf '%s\t%s\t%s\n' "$step" "$status" "$duration" >> "$RUNNER_STATUS_FILE"
}

slugify() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-'
}

run_with_log() {
  local step_key="$1"
  local log_file="$2"
  shift 2

  local started
  local finished
  local duration
  local status

  started="$(date +%s)"
  echo "== ${step_key} ==" | tee -a "$RUNNER_LOG"
  set +e
  /usr/bin/time -p "$@" 2>&1 | tee "$log_file" | tee -a "$RUNNER_LOG"
  status="${PIPESTATUS[0]}"
  set -e
  finished="$(date +%s)"
  duration="$((finished - started))"
  record_status "$step_key" "$status" "$duration"

  if [[ "$status" -eq 0 ]]; then
    echo "[PASS] ${step_key}" | tee -a "$RUNNER_LOG"
  else
    echo "[FAIL] ${step_key} (exit ${status})" | tee -a "$RUNNER_LOG"
    FAILURES+=("${step_key} failed (exit ${status}). See ${log_file#$LATEST_DIR/}.")
  fi
  echo | tee -a "$RUNNER_LOG"
  return "$status"
}

write_report() {
  local finished_utc="$1"
  local total_duration="$2"

  {
    echo "# Contract-Live QA Verification"
    echo
    echo "## Run Summary"
    echo
    echo "- Started (UTC): \`${RUN_STARTED_UTC}\`"
    echo "- Finished (UTC): \`${finished_utc}\`"
    echo "- Overall status: \`${OVERALL_STATUS}\`"
    echo "- Runner: \`${RUNNER_REL_PATH}\`"
    echo "- Base URL: \`${CONTRACT_LIVE_BASE_URL}\`"
    echo "- Email provider: \`${WINOE_EMAIL_PROVIDER}\`"
    echo "- Evidence bundle: \`contract_live_qa_latest/artifacts/${TIMESTAMP}/\`"
    echo "- Driver sequence: \`${DRIVER_SEQUENCE_RAW:-<none>}\`"
    echo "- Skip driver: \`${SKIP_DRIVER}\`"
    echo
    echo "## Artifact Layout"
    echo
    echo "- \`contract_live_qa_latest/contract_live_qa_report.md\`: latest run summary"
    echo "- \`contract_live_qa_latest/artifacts/\`: latest-run metadata and timestamped evidence bundles"
    echo "- Common top-level artifact files:"
    echo "  - \`runner-status.tsv\`"
    echo "  - \`runner.log\`"
    echo "  - \`pre-run-inventory.txt\`"
    echo "  - \`post-run-inventory.txt\`"
    echo "  - \`latest-run.txt\`"
    echo "- Current bundle contents:"
    echo "  - \`${TIMESTAMP}/playwright/\`"
    echo "  - \`${TIMESTAMP}/storage/\`"
    echo "  - \`${TIMESTAMP}/api/\` (when driver runs)"
    echo "  - \`${TIMESTAMP}/playwright-run.log\`"
    echo "  - \`${TIMESTAMP}/live-flow-driver-*.log\` (when driver runs)"
    echo
    echo "## Step Results"
    echo
    echo "| Step | Status | Exit Code |"
    echo "|---|---|---|"

    if [[ -f "$RUNNER_STATUS_FILE" ]]; then
      while IFS=$'\t' read -r step status duration; do
        echo "| \`${step}\` | \`$(status_label "$status")\` | \`${status}\` |"
      done < "$RUNNER_STATUS_FILE"
    fi

    echo
    echo "## Timing"
    echo
    echo "- Total duration (s): \`${total_duration}\`"

    if [[ -f "$RUNNER_STATUS_FILE" ]]; then
      while IFS=$'\t' read -r step status duration; do
        echo "- ${step} wall time (s): \`${duration}\`"
      done < "$RUNNER_STATUS_FILE"
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

PREVIOUS_LATEST_INVENTORY_TMP="$(mktemp)"
if [[ -d "$LATEST_DIR" ]]; then
  find "$LATEST_DIR" -maxdepth 5 -type f | sort > "$PREVIOUS_LATEST_INVENTORY_TMP"
fi

: > "$RUNNER_STATUS_FILE"
: > "$RUNNER_LOG"
if [[ -s "$PREVIOUS_LATEST_INVENTORY_TMP" ]]; then
  cp "$PREVIOUS_LATEST_INVENTORY_TMP" "$PRE_INVENTORY"
else
  : > "$PRE_INVENTORY"
fi
rm -f "$PREVIOUS_LATEST_INVENTORY_TMP"
record_status "step0_inventory" 0 0

echo "Contract-live timestamp: $TIMESTAMP" | tee -a "$RUNNER_LOG"
echo "Evidence directory: $EVIDENCE_DIR" | tee -a "$RUNNER_LOG"
echo "Storage states: $STORAGE_DIR" | tee -a "$RUNNER_LOG"
echo "Base URL: $CONTRACT_LIVE_BASE_URL" | tee -a "$RUNNER_LOG"
echo "WINOE_EMAIL_PROVIDER: $WINOE_EMAIL_PROVIDER" | tee -a "$RUNNER_LOG"
if [[ -n "${QA_E2E_TALENT_PARTNER_EMAIL:-}" && -n "${QA_E2E_TALENT_PARTNER_PASSWORD:-}" && -n "${QA_E2E_CANDIDATE_EMAIL:-}" && -n "${QA_E2E_CANDIDATE_PASSWORD:-}" ]]; then
  echo "Auth bootstrap: real Auth0 browser login" | tee -a "$RUNNER_LOG"
else
  echo "Auth bootstrap: local dev storage-state fallback" | tee -a "$RUNNER_LOG"
fi
echo "Driver sequence: ${DRIVER_SEQUENCE_RAW:-<none>}" | tee -a "$RUNNER_LOG"
echo | tee -a "$RUNNER_LOG"

start_clean_local_stack
wait_for_http_ready "http://localhost:3000" "Frontend"
wait_for_http_ready "http://localhost:8000/health" "Backend"
auth_login_preflight \
  "talent_partner" \
  "http://localhost:3000/auth/login?mode=talent_partner&returnTo=%2Fdashboard"
auth_login_preflight \
  "candidate" \
  "http://localhost:3000/auth/login?mode=candidate&returnTo=%2Fcandidate%2Fdashboard"

if ! run_with_log \
  "playwright_access_and_bootstrap" \
  "$EVIDENCE_DIR/playwright-run.log" \
  npx playwright test -c tests/e2e/contract-live/playwright.config.ts "$@"; then
  OVERALL_STATUS="FAIL"
fi

if [[ "$SKIP_DRIVER" == "1" ]]; then
  echo "Skipping live flow driver because CONTRACT_LIVE_SKIP_DRIVER=1" | tee -a "$RUNNER_LOG"
  record_status "live_flow_driver" 99 0
elif [[ -z "${DRIVER_SEQUENCE_RAW// }" ]]; then
  echo "No live flow driver commands requested." | tee -a "$RUNNER_LOG"
  record_status "live_flow_driver" 99 0
else
  if [[ -f "$EVIDENCE_DIR/api/fresh-live-summary.json" ]]; then
    export CONTRACT_LIVE_SUMMARY_FILE="$EVIDENCE_DIR/api/fresh-live-summary.json"
    export CONTRACT_LIVE_INVITE_TOKEN="$(
      node -e 'const fs = require("fs"); const path = process.argv[1]; const data = JSON.parse(fs.readFileSync(path, "utf8")); process.stdout.write(String(data.inviteToken ?? "").trim())' \
        "$EVIDENCE_DIR/api/fresh-live-summary.json"
    )"
    export CONTRACT_LIVE_TRIAL_ID="$(
      node -e 'const fs = require("fs"); const path = process.argv[1]; const data = JSON.parse(fs.readFileSync(path, "utf8")); process.stdout.write(String(data.trialId ?? "").trim())' \
        "$EVIDENCE_DIR/api/fresh-live-summary.json"
    )"
    export CONTRACT_LIVE_CANDIDATE_SESSION_ID="$(
      node -e 'const fs = require("fs"); const path = process.argv[1]; const data = JSON.parse(fs.readFileSync(path, "utf8")); process.stdout.write(String(data.candidateSessionId ?? "").trim())' \
        "$EVIDENCE_DIR/api/fresh-live-summary.json"
    )"
    echo "Loaded fresh live summary into driver env: trial=${CONTRACT_LIVE_TRIAL_ID:-<missing>} candidateSessionId=${CONTRACT_LIVE_CANDIDATE_SESSION_ID:-<missing>}" | tee -a "$RUNNER_LOG"
  fi

  IFS=',' read -r -a DRIVER_COMMANDS <<<"$DRIVER_SEQUENCE_RAW"
  for raw_command in "${DRIVER_COMMANDS[@]}"; do
    command_spec="$(echo "$raw_command" | xargs)"
    if [[ -z "$command_spec" ]]; then
      continue
    fi
    command_name="$command_spec"
    command_arg=""
    if [[ "$command_spec" == *:* ]]; then
      command_name="${command_spec%%:*}"
      command_arg="${command_spec#*:}"
    fi
    if [[ -z "$command_name" ]]; then
      continue
    fi
    step_key="live_flow_driver_$(slugify "$command_spec")"
    command_env=()
    if [[ "$command_name" == "candidate-day" && -n "$command_arg" ]]; then
      command_env=(
        CONTRACT_LIVE_DAY="$command_arg"
        CONTRACT_LIVE_EXPECT_DAY="$command_arg"
      )
    fi
    if ! run_with_log \
      "$step_key" \
      "$EVIDENCE_DIR/${step_key}.log" \
      env "${command_env[@]}" \
      bash -lc "cd '$REPO_ROOT' && node 'qa_verifications/Contract-Live-QA/live_flow_driver.mjs' '$command_name'"; then
      OVERALL_STATUS="FAIL"
      break
    fi
  done
fi

RUN_FINISHED_UTC="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
RUN_FINISHED_EPOCH="$(date +%s)"
TOTAL_DURATION="$((RUN_FINISHED_EPOCH - RUN_STARTED_EPOCH))"

printf '%s\n' "$EVIDENCE_DIR" > "$LATEST_RUN_FILE"
write_report "$RUN_FINISHED_UTC" "$TOTAL_DURATION"
record_status "write_report" 0 0
find "$LATEST_DIR" -maxdepth 5 -type f | sort > "$POST_INVENTORY"

cat "$REPORT_MD"

if [[ "$OVERALL_STATUS" != "PASS" ]]; then
  exit 1
fi
