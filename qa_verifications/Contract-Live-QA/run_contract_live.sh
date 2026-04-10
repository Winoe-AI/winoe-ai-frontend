#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
QA_ROOT="$SCRIPT_DIR"
REPO_ROOT="$(cd "$QA_ROOT/../.." && pwd)"
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

export CONTRACT_LIVE_TIMESTAMP="$TIMESTAMP"
export CONTRACT_LIVE_ARTIFACTS_DIR="$EVIDENCE_DIR"
export QA_E2E_STORAGE_DIR="$STORAGE_DIR"
export CONTRACT_LIVE_BASE_URL="${CONTRACT_LIVE_BASE_URL:-http://localhost:3000}"
export WINOE_EMAIL_PROVIDER="${WINOE_EMAIL_PROVIDER:-console}"

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
echo "Auth bootstrap: real Auth0 browser login" | tee -a "$RUNNER_LOG"
echo "Driver sequence: ${DRIVER_SEQUENCE_RAW:-<none>}" | tee -a "$RUNNER_LOG"
echo | tee -a "$RUNNER_LOG"

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
  IFS=',' read -r -a DRIVER_COMMANDS <<<"$DRIVER_SEQUENCE_RAW"
  for raw_command in "${DRIVER_COMMANDS[@]}"; do
    command="$(echo "$raw_command" | xargs)"
    if [[ -z "$command" ]]; then
      continue
    fi
    step_key="live_flow_driver_$(slugify "$command")"
    if ! run_with_log \
      "$step_key" \
      "$EVIDENCE_DIR/${step_key}.log" \
      bash -lc "cd '$REPO_ROOT' && node 'qa_verifications/Contract-Live-QA/live_flow_driver.mjs' '$command'"; then
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
