#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
REPO_ROOT="$(cd "$FRONTEND_DIR/.." && pwd)"
BACKEND_DIR="$REPO_ROOT/winoe-backend"
QA_ROOT="$SCRIPT_DIR"
TIMESTAMP="${CONTRACT_LIVE_TIMESTAMP:-$(date +%Y%m%dT%H%M%S)}"
ARTIFACTS_ROOT="${CONTRACT_LIVE_ARTIFACTS_ROOT:-$QA_ROOT/contract_live_qa_latest/artifacts}"
EVIDENCE_DIR="${CONTRACT_LIVE_ARTIFACTS_DIR:-$ARTIFACTS_ROOT/$TIMESTAMP}"
LOG_DIR="$EVIDENCE_DIR/logs"
STACK_LABEL="${CONTRACT_LIVE_STACK_LABEL:-}"
LOG_SUFFIX=""
FAKE_TIME="${CONTRACT_LIVE_FAKE_TIME:-2026-04-03 09:00:00}"
FAKE_TIMEZONE="${CONTRACT_LIVE_FAKE_TIMEZONE:-America/New_York}"
EMAIL_PROVIDER="${WINOE_EMAIL_PROVIDER:-console}"
AUTH0_LEEWAY_SECONDS="${CONTRACT_LIVE_AUTH0_LEEWAY_SECONDS:-259200}"
BACKEND_HOST="${CONTRACT_LIVE_BACKEND_HOST:-127.0.0.1}"
BACKEND_PORT="${CONTRACT_LIVE_BACKEND_PORT:-8000}"
FRONTEND_HOST="${CONTRACT_LIVE_FRONTEND_HOST:-127.0.0.1}"
FRONTEND_PORT="${CONTRACT_LIVE_FRONTEND_PORT:-3000}"

if [[ -n "${STACK_LABEL// }" ]]; then
  SAFE_STACK_LABEL="$(echo "$STACK_LABEL" | tr ' /' '__')"
  LOG_SUFFIX="-$SAFE_STACK_LABEL"
fi

FAKE_TIME_UTC="$(
  CONTRACT_LIVE_FAKE_TIME="$FAKE_TIME" CONTRACT_LIVE_FAKE_TIMEZONE="$FAKE_TIMEZONE" python3 - <<'PY'
from datetime import UTC, datetime
from zoneinfo import ZoneInfo
import os

raw = os.environ["CONTRACT_LIVE_FAKE_TIME"].strip()
timezone_name = os.environ["CONTRACT_LIVE_FAKE_TIMEZONE"].strip() or "UTC"
normalized = raw[:-1] + "+00:00" if raw.endswith("Z") else raw

try:
    parsed = datetime.fromisoformat(normalized)
except ValueError:
    parsed = datetime.strptime(raw, "%Y-%m-%d %H:%M:%S")

if parsed.tzinfo is None:
    parsed = parsed.replace(tzinfo=ZoneInfo(timezone_name))

print(parsed.astimezone(UTC).isoformat().replace("+00:00", "Z"))
PY
)"

mkdir -p "$LOG_DIR"

BACKEND_LOG="$LOG_DIR/backend$LOG_SUFFIX.log"
WORKER_LOG="$LOG_DIR/worker$LOG_SUFFIX.log"
FRONTEND_LOG="$LOG_DIR/frontend$LOG_SUFFIX.log"
STACK_META="$LOG_DIR/stack$LOG_SUFFIX.env"

cat >"$STACK_META" <<EOF
CONTRACT_LIVE_TIMESTAMP=$TIMESTAMP
CONTRACT_LIVE_FAKE_TIME=$FAKE_TIME
CONTRACT_LIVE_FAKE_TIMEZONE=$FAKE_TIMEZONE
CONTRACT_LIVE_FAKE_TIME_UTC=$FAKE_TIME_UTC
WINOE_TEST_NOW_UTC=$FAKE_TIME_UTC
NEXT_PUBLIC_WINOE_TEST_NOW_UTC=$FAKE_TIME_UTC
WINOE_EMAIL_PROVIDER=$EMAIL_PROVIDER
WINOE_AUTH0_LEEWAY_SECONDS=$AUTH0_LEEWAY_SECONDS
CONTRACT_LIVE_BACKEND_URL=http://$BACKEND_HOST:$BACKEND_PORT
CONTRACT_LIVE_FRONTEND_URL=http://$FRONTEND_HOST:$FRONTEND_PORT
CONTRACT_LIVE_STACK_LABEL=$STACK_LABEL
EOF

echo "Contract-live evidence: $EVIDENCE_DIR"
echo "Contract-live fake time: $FAKE_TIME"
echo "Contract-live fake timezone: $FAKE_TIMEZONE"
echo "Contract-live fake UTC: $FAKE_TIME_UTC"
if [[ -n "${STACK_LABEL// }" ]]; then
  echo "Contract-live stack label: $STACK_LABEL"
fi
echo "Backend log: $BACKEND_LOG"
echo "Worker log: $WORKER_LOG"
echo "Frontend log: $FRONTEND_LOG"

cleanup() {
  local code=$?
  if [[ -n "${BACKEND_PID:-}" ]]; then
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "${WORKER_PID:-}" ]]; then
    kill "$WORKER_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "${FRONTEND_PID:-}" ]]; then
    kill "$FRONTEND_PID" >/dev/null 2>&1 || true
  fi
  wait >/dev/null 2>&1 || true
  exit "$code"
}
trap cleanup EXIT INT TERM

wait_for_url() {
  local url="$1"
  local label="$2"
  for _ in $(seq 1 90); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo "$label is ready: $url"
      return 0
    fi
    sleep 1
  done
  echo "$label failed to become ready: $url" >&2
  return 1
}

(
  cd "$BACKEND_DIR"
  export WINOE_EMAIL_PROVIDER="$EMAIL_PROVIDER"
  export WINOE_AUTH0_LEEWAY_SECONDS="$AUTH0_LEEWAY_SECONDS"
  export DEV_AUTH_BYPASS="${DEV_AUTH_BYPASS:-0}"
  export WINOE_DEV_AUTH_BYPASS="${WINOE_DEV_AUTH_BYPASS:-0}"
  export CONTRACT_LIVE_FAKE_TIME_UTC="$FAKE_TIME_UTC"
  export WINOE_TEST_NOW_UTC="$FAKE_TIME_UTC"
  exec poetry run uvicorn app.main:app --host "$BACKEND_HOST" --port "$BACKEND_PORT"
) >"$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

(
  cd "$BACKEND_DIR"
  export WINOE_EMAIL_PROVIDER="$EMAIL_PROVIDER"
  export WINOE_AUTH0_LEEWAY_SECONDS="$AUTH0_LEEWAY_SECONDS"
  export DEV_AUTH_BYPASS="${DEV_AUTH_BYPASS:-0}"
  export WINOE_DEV_AUTH_BYPASS="${WINOE_DEV_AUTH_BYPASS:-0}"
  export CONTRACT_LIVE_FAKE_TIME_UTC="$FAKE_TIME_UTC"
  export WINOE_TEST_NOW_UTC="$FAKE_TIME_UTC"
  exec poetry run python -m app.shared.jobs.shared_jobs_worker_service
) >"$WORKER_LOG" 2>&1 &
WORKER_PID=$!

(
  cd "$FRONTEND_DIR"
  export WINOE_EMAIL_PROVIDER="$EMAIL_PROVIDER"
  export CONTRACT_LIVE_FAKE_TIME_UTC="$FAKE_TIME_UTC"
  export WINOE_TEST_NOW_UTC="$FAKE_TIME_UTC"
  export NEXT_PUBLIC_WINOE_TEST_NOW_UTC="$FAKE_TIME_UTC"
  exec npm run dev -- --hostname "$FRONTEND_HOST" --port "$FRONTEND_PORT"
) >"$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!

wait_for_url "http://$BACKEND_HOST:$BACKEND_PORT/health" "Backend"
wait_for_url "http://$FRONTEND_HOST:$FRONTEND_PORT/api/health" "Frontend"

echo "Backend PID: $BACKEND_PID"
echo "Worker PID: $WORKER_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Press Ctrl-C to stop the stack."

wait
