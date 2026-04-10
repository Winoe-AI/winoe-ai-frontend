# API Map Summary

`docs/frontend/api-integration.md` is the canonical frontend↔backend API mapping document.

This file is intentionally short to avoid duplicate drift.

## Integration Modes

- Candidate client calls: `/api/backend/*` proxy pattern (frontend proxy to backend `/api/*`).
- Talent Partner BFF calls: `/api/*` route handlers in `src/app/api/**` forwarding to backend `/api/*`.
- Direct external upload: Day 4 handoff video upload goes to signed storage URL (not a backend app endpoint).

## Canonical Matrix

Use `docs/frontend/api-integration.md` for:

- frontend call site/hook
- HTTP method
- frontend route (if BFF)
- backend endpoint
- request/response shapes
- auth mode
- page/component consumers
- backend cross-reference status (`verified`, `mismatch`, `frontend-only`)
- concrete file references for mismatches
