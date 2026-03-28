# Planned / Known Gaps

This file lists currently observed gaps from code review.

## Integration Gaps

- `fetchCandidateSubmissions` currently sends extra query keys (`candidate_session_id`, `simulationId`, `simulation_id`) while backend submissions list route only defines `candidateSessionId`, `taskId`, `limit`, and `offset`.
- This works today because backend ignores unknown query keys, but it is contract drift.
- See `docs/frontend/api-integration.md` mismatch entry for exact file references.

## API Surface Cleanup Candidates

- `/api/auth/access-token` and `/api/dev/access-token` route handlers are intentionally disabled (`410`) and only reachable in local environment checks.
- If these are no longer needed, remove route files and related tests/docs to reduce surface area.

## Documentation Follow-Up

- Generated catalogs intentionally flag uncertain entries as `Purpose unclear — needs review`.
- Those entries should be resolved incrementally by domain owners during future refactors.
