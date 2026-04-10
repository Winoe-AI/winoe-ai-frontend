#!/usr/bin/env bash
set -euo pipefail

export WINOE_BACKEND_BASE_URL="${WINOE_BACKEND_BASE_URL:-http://localhost:8000}"

echo "Using WINOE_BACKEND_BASE_URL=${WINOE_BACKEND_BASE_URL}"
npm run dev
