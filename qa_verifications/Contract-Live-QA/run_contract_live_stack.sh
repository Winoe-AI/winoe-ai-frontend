#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
REPO_ROOT="$(cd "$FRONTEND_DIR/.." && pwd)"
BACKEND_DIR="$REPO_ROOT/winoe-backend"
QA_ROOT="$SCRIPT_DIR"
source "$SCRIPT_DIR/contract_live_env.sh"
TIMESTAMP="${CONTRACT_LIVE_TIMESTAMP:-$(date +%Y%m%dT%H%M%S)}"
ARTIFACTS_ROOT="${CONTRACT_LIVE_ARTIFACTS_ROOT:-$QA_ROOT/contract_live_qa_latest/artifacts}"
EVIDENCE_DIR="${CONTRACT_LIVE_ARTIFACTS_DIR:-$ARTIFACTS_ROOT/$TIMESTAMP}"
LOG_DIR="$EVIDENCE_DIR/logs"
STACK_LABEL="${CONTRACT_LIVE_STACK_LABEL:-}"
LOG_SUFFIX=""
FAKE_TIME="${CONTRACT_LIVE_FAKE_TIME:-2026-04-03 09:00:00}"
FAKE_TIMEZONE="${CONTRACT_LIVE_FAKE_TIMEZONE:-America/New_York}"
EMAIL_PROVIDER="${WINOE_EMAIL_PROVIDER:-console}"
SCENARIO_GENERATION_RUNTIME_MODE="${CONTRACT_LIVE_SCENARIO_GENERATION_RUNTIME_MODE:-${WINOE_SCENARIO_GENERATION_RUNTIME_MODE:-demo}}"
SCENARIO_GENERATION_PROVIDER="${WINOE_SCENARIO_GENERATION_PROVIDER:-anthropic}"
SCENARIO_GENERATION_MODEL="${WINOE_SCENARIO_GENERATION_MODEL:-claude-opus-4-6}"
AUTH0_LEEWAY_SECONDS="${CONTRACT_LIVE_AUTH0_LEEWAY_SECONDS:-259200}"
BACKEND_HOST="${CONTRACT_LIVE_BACKEND_HOST:-127.0.0.1}"
BACKEND_PORT="${CONTRACT_LIVE_BACKEND_PORT:-8000}"
FRONTEND_HOST="${CONTRACT_LIVE_FRONTEND_HOST:-127.0.0.1}"
FRONTEND_PORT="${CONTRACT_LIVE_FRONTEND_PORT:-3000}"

load_contract_live_local_env "$FRONTEND_DIR/.env.local" "$BACKEND_DIR/.env"

USE_LOCAL_DEV_AUTH=0
if [[ -z "${QA_E2E_TALENT_PARTNER_EMAIL:-}" || -z "${QA_E2E_TALENT_PARTNER_PASSWORD:-}" || -z "${QA_E2E_CANDIDATE_EMAIL:-}" || -z "${QA_E2E_CANDIDATE_PASSWORD:-}" ]]; then
  USE_LOCAL_DEV_AUTH=1
fi
if [[ "$USE_LOCAL_DEV_AUTH" -eq 1 ]]; then
  export CONTRACT_LIVE_DEV_AUTH_BYPASS=1
fi

apply_local_dev_auth_env() {
  if [[ "$USE_LOCAL_DEV_AUTH" -eq 1 ]]; then
    export DEV_AUTH_BYPASS=1
    export WINOE_DEV_AUTH_BYPASS=1
    export CONTRACT_LIVE_DEV_AUTH_BYPASS=1
    return 0
  fi

  export DEV_AUTH_BYPASS="${DEV_AUTH_BYPASS:-0}"
  export WINOE_DEV_AUTH_BYPASS="${WINOE_DEV_AUTH_BYPASS:-0}"
  export CONTRACT_LIVE_DEV_AUTH_BYPASS="${CONTRACT_LIVE_DEV_AUTH_BYPASS:-0}"
}

if command -v gh >/dev/null 2>&1; then
  GH_AUTH_TOKEN="$(gh auth token 2>/dev/null || true)"
  if [[ -n "${GH_AUTH_TOKEN:-}" ]] && [[ "${CONTRACT_LIVE_PREFER_GH_TOKEN:-1}" != "0" ]]; then
    export WINOE_GITHUB_TOKEN="$GH_AUTH_TOKEN"
  fi
fi

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
WINOE_SCENARIO_GENERATION_RUNTIME_MODE=$SCENARIO_GENERATION_RUNTIME_MODE
WINOE_SCENARIO_GENERATION_PROVIDER=$SCENARIO_GENERATION_PROVIDER
WINOE_SCENARIO_GENERATION_MODEL=$SCENARIO_GENERATION_MODEL
WINOE_AUTH0_LEEWAY_SECONDS=$AUTH0_LEEWAY_SECONDS
CONTRACT_LIVE_BACKEND_URL=http://$BACKEND_HOST:$BACKEND_PORT
CONTRACT_LIVE_FRONTEND_URL=http://$FRONTEND_HOST:$FRONTEND_PORT
CONTRACT_LIVE_STACK_LABEL=$STACK_LABEL
EOF

echo "Contract-live evidence: $EVIDENCE_DIR"
echo "Contract-live fake time: $FAKE_TIME"
echo "Contract-live fake timezone: $FAKE_TIMEZONE"
echo "Contract-live fake UTC: $FAKE_TIME_UTC"
echo "Contract-live scenario generation runtime mode: $SCENARIO_GENERATION_RUNTIME_MODE"
echo "Contract-live scenario generation provider: $SCENARIO_GENERATION_PROVIDER"
echo "Contract-live scenario generation model: $SCENARIO_GENERATION_MODEL"
if [[ "$USE_LOCAL_DEV_AUTH" -eq 1 ]]; then
  echo "Contract-live auth bootstrap mode: local dev auth bypass"
else
  echo "Contract-live auth bootstrap mode: real Auth0"
fi
if [[ -n "${STACK_LABEL// }" ]]; then
  echo "Contract-live stack label: $STACK_LABEL"
fi
echo "Backend log: $BACKEND_LOG"
echo "Worker log: $WORKER_LOG"
echo "Frontend log: $FRONTEND_LOG"

port_pids() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -ti tcp:"$port" 2>/dev/null | sort -u
  fi
}

process_command() {
  local pid="$1"
  ps -p "$pid" -o command= 2>/dev/null | xargs || true
}

is_safe_listener() {
  local command_line="$1"
  case "$command_line" in
    *"$FRONTEND_DIR"*|*"next dev"*|*"next start"*|*"npm run dev"*|*"npm run start"*)
      return 0
      ;;
    *"$BACKEND_DIR"*|*"uvicorn app.main:app"*|*"runBackend.sh up"*|*"shared_jobs_worker_service"*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

clear_port_if_safe() {
  local port="$1"
  local label="$2"
  local pids=()
  mapfile -t pids < <(port_pids "$port")
  if [[ "${#pids[@]}" -eq 0 ]]; then
    return 0
  fi

  local pid command_line
  local has_safe=0
  for pid in "${pids[@]}"; do
    command_line="$(process_command "$pid")"
    if is_safe_listener "$command_line"; then
      has_safe=1
    fi
  done

  if [[ "$has_safe" -eq 0 ]]; then
    echo "${label} port ${port} is already in use by an unsafe process:" >&2
    for pid in "${pids[@]}"; do
      command_line="$(process_command "$pid")"
      echo "  PID ${pid}: ${command_line:-<unknown>}" >&2
    done
    echo "Refusing to start a new stack until the port is free." >&2
    exit 1
  fi

  for pid in "${pids[@]}"; do
    command_line="$(process_command "$pid")"
    echo "Stopping stale ${label} listener on port ${port}: PID ${pid} ${command_line}" >&2
    kill "$pid" >/dev/null 2>&1 || true
  done

  for _ in $(seq 1 20); do
    mapfile -t pids < <(port_pids "$port")
    if [[ "${#pids[@]}" -eq 0 ]]; then
      return 0
    fi
    sleep 1
  done

  echo "${label} port ${port} did not stop cleanly after requesting shutdown." >&2
  exit 1
}

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

clear_port_if_safe "$BACKEND_PORT" "backend"
clear_port_if_safe "$FRONTEND_PORT" "frontend"

bootstrap_local_database() {
  echo "Resetting local backend database with runBackend.sh bootstrap-local." >&2
  (
    cd "$BACKEND_DIR"
    export WINOE_EMAIL_PROVIDER="$EMAIL_PROVIDER"
    export WINOE_DEMO_MODE=1
    export WINOE_SCENARIO_DEMO_MODE=1
    export WINOE_SCENARIO_GENERATION_RUNTIME_MODE="$SCENARIO_GENERATION_RUNTIME_MODE"
    export WINOE_SCENARIO_GENERATION_PROVIDER="$SCENARIO_GENERATION_PROVIDER"
    export WINOE_SCENARIO_GENERATION_MODEL="$SCENARIO_GENERATION_MODEL"
    export WINOE_AUTH0_LEEWAY_SECONDS="$AUTH0_LEEWAY_SECONDS"
    apply_local_dev_auth_env
    export CONTRACT_LIVE_FAKE_TIME_UTC="$FAKE_TIME_UTC"
    export WINOE_TEST_NOW_UTC="$FAKE_TIME_UTC"
    export WINOE_BACKEND_BASE_URL="http://$BACKEND_HOST:$BACKEND_PORT"
    exec ./runBackend.sh bootstrap-local
  ) >"$LOG_DIR/bootstrap-local.log" 2>&1
}

bootstrap_local_database

wait_for_url() {
  local url="$1"
  local label="$2"
  local pid="${3:-}"
  for _ in $(seq 1 90); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo "$label is ready: $url"
      return 0
    fi
    if [[ -n "$pid" ]] && ! kill -0 "$pid" >/dev/null 2>&1; then
      echo "$label process exited before ready: $url" >&2
      return 1
    fi
    sleep 1
  done
  echo "$label failed to become ready: $url" >&2
  return 1
}

(
  cd "$BACKEND_DIR"
  export WINOE_EMAIL_PROVIDER="$EMAIL_PROVIDER"
  export WINOE_DEMO_MODE=1
  export WINOE_SCENARIO_DEMO_MODE=1
  export WINOE_SCENARIO_GENERATION_RUNTIME_MODE="$SCENARIO_GENERATION_RUNTIME_MODE"
  export WINOE_SCENARIO_GENERATION_PROVIDER="$SCENARIO_GENERATION_PROVIDER"
  export WINOE_SCENARIO_GENERATION_MODEL="$SCENARIO_GENERATION_MODEL"
  export WINOE_AUTH0_LEEWAY_SECONDS="$AUTH0_LEEWAY_SECONDS"
  apply_local_dev_auth_env
  export CONTRACT_LIVE_FAKE_TIME_UTC="$FAKE_TIME_UTC"
  export WINOE_TEST_NOW_UTC="$FAKE_TIME_UTC"
  export WINOE_BACKEND_BASE_URL="http://$BACKEND_HOST:$BACKEND_PORT"
  exec poetry run uvicorn app.main:app --host "$BACKEND_HOST" --port "$BACKEND_PORT"
) >"$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

(
  cd "$BACKEND_DIR"
  export WINOE_EMAIL_PROVIDER="$EMAIL_PROVIDER"
  export WINOE_DEMO_MODE=1
  export WINOE_SCENARIO_DEMO_MODE=1
  export WINOE_SCENARIO_GENERATION_RUNTIME_MODE="$SCENARIO_GENERATION_RUNTIME_MODE"
  export WINOE_SCENARIO_GENERATION_PROVIDER="$SCENARIO_GENERATION_PROVIDER"
  export WINOE_SCENARIO_GENERATION_MODEL="$SCENARIO_GENERATION_MODEL"
  export WINOE_AUTH0_LEEWAY_SECONDS="$AUTH0_LEEWAY_SECONDS"
  apply_local_dev_auth_env
  export CONTRACT_LIVE_FAKE_TIME_UTC="$FAKE_TIME_UTC"
  export WINOE_TEST_NOW_UTC="$FAKE_TIME_UTC"
  export WINOE_BACKEND_BASE_URL="http://$BACKEND_HOST:$BACKEND_PORT"
  exec poetry run python -m app.shared.jobs.shared_jobs_worker_service
) >"$WORKER_LOG" 2>&1 &
WORKER_PID=$!

  (
    cd "$FRONTEND_DIR"
  export WINOE_EMAIL_PROVIDER="$EMAIL_PROVIDER"
  export WINOE_DEMO_MODE=1
  export WINOE_SCENARIO_DEMO_MODE=1
  export CONTRACT_LIVE_FAKE_TIME_UTC="$FAKE_TIME_UTC"
  export WINOE_TEST_NOW_UTC="$FAKE_TIME_UTC"
  export NEXT_PUBLIC_WINOE_TEST_NOW_UTC="$FAKE_TIME_UTC"
  apply_local_dev_auth_env
  export WINOE_BACKEND_BASE_URL="http://$BACKEND_HOST:$BACKEND_PORT"
  exec npm run dev -- --hostname "$FRONTEND_HOST" --port "$FRONTEND_PORT"
) >"$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!

wait_for_url "http://$BACKEND_HOST:$BACKEND_PORT/health" "Backend" "$BACKEND_PID"
wait_for_url "http://$FRONTEND_HOST:$FRONTEND_PORT/api/health" "Frontend" "$FRONTEND_PID"

echo "Backend PID: $BACKEND_PID"
echo "Worker PID: $WORKER_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Press Ctrl-C to stop the stack."

wait
