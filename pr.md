# Task 4: Talent Partner Trial Creation (v4)

## Summary

- Built the v4 Talent Partner Trial Creation wizard at `/talent-partner/trials/new`.
- Added a polished Generation Loading state with six visible Winoe drafting steps, rotating context lines, SSE progress handling, reconnect/failure states, and 12-second minimum perceived timing.
- Added `/dashboard/trials/new` compatibility route rendering the same wizard.
- Updated dashboard, list, header, and command palette entry points to the canonical route.
- Added frontend tests for the v4 wizard, `createTrialV4`, EventSource behavior, redirect timing, failure handling, and retired-field exclusion.

## Validation

- `npm run lint` — pass
- `npm run typecheck` — pass
- `npm test` — pass
- `./precommit.sh` — pass
- Retired frontend field grep — no matches
- Retired user-facing vocabulary grep — no matches

## Real Local QA Evidence

- Backend server: running on localhost:8000
- Frontend server: running on localhost:3000
- Talent Partner login: pass (`/api/dev/qa-login`, local-only)
- `/talent-partner/trials/new`: pass
- `/dashboard/trials/new`: pass
- Step 1 validation: pass
- Step 2 validation: pass
- v4 create request shape: pass (see `artifacts/create-trial-post-body.json`)
- Generation Loading: pass
- SSE progress stream: pass (EventSource to `/api/v1/trials/{trial_id}/generation-progress`)
- Completion redirect to `/talent-partner/trials/{id}/preview`: pass (with `WINOE_SCENARIO_GENERATION_RUNTIME_MODE=demo` for reproducible worker completion; `real` mode hit LLM failures in this environment — see `qa-report.md`)
- Failure state tested: pass (Playwright abort on generation-progress stream)
- Artifact folder: `qa_verifications/task-4-trial-creation-flow/20260512-131043/`

## Notes

- `/talent-partner/trials/{id}/preview` is intentionally a placeholder. Full preview and approval work belongs to Task 5.
- Preferred language/framework is optional and informational. The candidate may use any stack.
