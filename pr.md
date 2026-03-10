# Title

Issue #147: Codespaces unavailability fallback + integrity messaging alignment (Day 2/Day 3)

## TL;DR

- Day 2/Day 3 workspace flow now degrades gracefully when Codespaces init/status cannot reach ready state.
- Added a reusable `CodespaceFallbackPanel` with copyable repo URL + local clone/test/push checklist.
- Retry behavior is explicit (`init` retry vs status retry), and fallback guidance is preserved when retries fail again.
- Integrity messaging now uses one shared sentence across surfaces to avoid overclaiming enforcement.
- Manual QA for Issue #147 is complete and PASS with artifact-backed Playwright verification across scenarios A-G.

## Problem

Candidates could get blocked when Codespaces policies or runtime availability prevented initialization, with no clear local path shown in the UI.

Prior copy also risked implying stronger enforcement than what we actually enforce. The product model is commit-time based, so copy must explicitly state that only pushed commits before cutoff are evaluated.

## What changed

- Added reusable `CodespaceFallbackPanel` for compact local fallback guidance.
- Added deterministic codespace availability handling (`ready` / `not_ready` / `unavailable` / `error`) derived from status payloads, codespace state signals, and error codes/messages.
- Implemented explicit retry semantics:
  - init-path fallback retries call `init` again.
  - status-path fallback retries call status refresh.
- Preserved fallback state after retry failures (retry no longer hides guidance permanently if the next attempt fails).
- Gated actionable fallback instructions on `repoUrl` availability.
- Updated shared integrity copy constant and reused it in candidate and recruiter integrity callouts.

## Behavior details

- Immediate fallback on init failure:
  - If init returns terminal/unavailable/error during initial load, fallback is shown immediately.
- Persistent `not_ready` threshold:
  - Fallback appears after `3` consecutive `not_ready` checks with `4000ms` poll interval.
- Non-actionable retry state when repo identity is incomplete:
  - If fallback is triggered before `repoUrl` is available, UI shows a compact retry-only state (`Codespaces unavailable, repo details still loading`) rather than clone commands.
  - Once `repoUrl` is available, actionable clone instructions are shown.
- Exact integrity message now used:
  - "You may work offline/locally, but only commits pushed to the official repo before cutoff are evaluated."

## Testing

Targeted tests added/updated:

- `tests/unit/features/candidate/session/task/WorkspacePanel.codespaceFallback.test.tsx`
- `tests/unit/features/candidate/session/task/CodespaceFallbackPanel.test.tsx`
- `tests/unit/features/candidate/session/task/WorkspacePanel.test.tsx`
- `tests/unit/shared/ui/IntegrityCallout.test.tsx`
- `tests/unit/features/recruiter/candidate-submissions/ArtifactCard.test.tsx`
- `tests/unit/lib/api/candidate.test.ts`

Automated checks run:

- `npm run lint` -> PASS
- `npm run typecheck` -> PASS
- `npm test` -> PASS (`238` suites, `1479` tests)
- `npm run build` -> PASS

Precommit note:

- `precommit.sh` includes lint/test/typecheck/build; build parity was verified directly with `npm run build`.

Manual QA:

- PASS (see `Manual QA / Verification` section below for runtime method, scenario matrix, and artifacts).

## Manual QA / Verification

Verdict: PASS

Runtime method:

- Real localhost frontend + backend runtime.
- Playwright Chromium verification.
- Targeted route interception for deterministic Codespaces failure/edge states:
  - `POST /api/backend/tasks/{task_id}/codespace/init`
  - `GET /api/backend/tasks/{task_id}/codespace/status`

Environment:

- Frontend branch/commit:
  - `feature/codespaces-policy-constraints-messaging-fallback-instructions-when-unavailable-147`
  - `d4b90a8dcc9d0cb738662e6e41e7b203b910bb13`
- Backend branch/commit:
  - `main`
  - `24cec485e921fbef88d5220be9d211c037905395`
- Ports:
  - frontend `127.0.0.1:3000`
  - backend `127.0.0.1:8000`
  - JWKS `127.0.0.1:8787`
- Browser/runtime:
  - Playwright Chromium `1.57.0`

Scenario matrix:

- Scenario A (baseline ready path): PASS
- Scenario B (init failure with no repo identity): PASS
- Scenario C (persistent `not_ready` with repo URL): PASS
- Scenario D (ready before threshold): PASS
- Scenario E (retry after init failure recovers): PASS
- Scenario F (retry failure preserves fallback guidance): PASS
- Scenario G (Day 2/Day 3 integrity copy consistency): PASS

Key verified behaviors:

- Candidate is not blocked when Codespaces is unavailable.
- Actionable fallback appears only when `repoUrl` exists.
- Non-actionable retry-only state appears when repo details are unavailable.
- Retry semantics are correct for both init retry and status retry paths.
- Day 2 and Day 3 both show the exact required sentence:
  - "You may work offline/locally, but only commits pushed to the official repo before cutoff are evaluated."

## Files of interest

- `src/features/candidate/session/task/components/CodespaceFallbackPanel.tsx`
- `src/features/candidate/session/task/components/WorkspacePanel.tsx`
- `src/features/candidate/session/task/hooks/useWorkspaceStatus.ts`
- `src/features/candidate/session/task/utils/codespaceAvailability.ts`
- `src/features/candidate/session/task/utils/loadWorkspaceStatus.ts`
- `src/lib/copy/integrity.ts`
- `src/shared/ui/IntegrityCallout.tsx`
- `tests/unit/features/candidate/session/task/WorkspacePanel.codespaceFallback.test.tsx`
- `tests/unit/features/candidate/session/task/CodespaceFallbackPanel.test.tsx`

## Risks / rollout notes

- Telemetry is currently non-PII `console.info` via `[candidate:codespace_fallback_shown]`.
- Fallback threshold is currently `3` polls at `4000ms`; this is intentionally conservative for MVP and may need tuning with real usage.
- Recruiter-facing copy alignment is intentional because integrity copy is shared (`OFFICIAL_REPO_CUTOFF_COPY`).

## Screenshots / Evidence

- Evidence bundle folder (local QA artifacts):
  - `.qa/issue147/manual_qa_20260309_192344/`
- Main report:
  - `.qa/issue147/manual_qa_20260309_192344/QA_REPORT.md`
- Structured result artifact:
  - `.qa/issue147/manual_qa_20260309_192344/artifacts/issue147_playwright_result.json`
- Representative screenshots:
  - `01_A_happy_path_day2_ready.png`
  - `02_B_init_failure_no_repo_identity.png`
  - `03_C_before_threshold_no_fallback.png`
  - `04_C_after_threshold_actionable_fallback.png`
  - `05_D_ready_before_threshold.png`
  - `07_E_retry_recovered_ready.png`
  - `09_F_retry_failed_fallback_persists.png`
  - `10_G_day2_integrity_copy.png`
  - `11_G_day3_integrity_copy.png`

Note:

- Artifacts above are local repository evidence; no external sanitized/shareable bundle is claimed in this PR note.
