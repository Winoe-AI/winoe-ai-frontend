## Title

Unify Day 2/Day 3 candidate coding workspace UI and split checkpoint vs final submission states (Issue #139)

## TL;DR

- Lifted a shared `codingWorkspace` normalization to the session controller so Day 2 and Day 3 consume one workspace identity.
- Day 2 (`code`) and Day 3 (`debug`) panels now render the same repo/codespace identity under a shared **Coding workspace** section.
- Submit status semantics now differ by day: Day 2 shows **Checkpoint recorded**; Day 3 shows **Final recorded**.
- Added fail-closed mismatch handling: if Day 2/Day 3 workspace snapshots conflict, repo/codespace links are hidden and an explicit mismatch error is shown.
- Kept backward compatibility during backend SHA rollout by preferring `checkpointSha`/`finalSha` and falling back to `commitSha` as **Recorded commit**.

## Problem

MVP1 requires candidates to continue in a single repo across Day 2 and Day 3. The prior frontend behavior could present day-local workspace data and ambiguous submission messaging, which made recruiter interpretation harder and risked demo-breaker inconsistency for the GitHub-native runtime flow.

## What changed

### Shared `codingWorkspace` normalization at controller/view layer

- Added workspace normalization/merge utilities (`getCodingWorkspace`, conflict detection, equality checks) to derive a single coding workspace view model from Day 2 + Day 3 snapshots.
- Lifted workspace state into `useCandidateSessionController` and exposed a shared `codingWorkspace` object through the running view pipeline.

### Both coding-day panels consume shared workspace identity

- Wired `codingWorkspace` through `CandidateSessionView` → running view components → workspace panel.
- Workspace panel now prefers shared workspace identity when available, so Day 2 and Day 3 show the same repo/codespace links.

### Workspace header and panel semantics

- Updated workspace header copy to **Coding workspace**.
- Kept the workspace panel actionable for normal states and explicit for read-only/day-closed states.

### Submit-state semantics and SHA labeling

- Day 2 submit status resolves to **Checkpoint recorded** and surfaces `checkpointSha` when present.
- Day 3 submit status resolves to **Final recorded** and surfaces `finalSha` when present.
- If day-specific SHA fields are absent, UI falls back to canonical `commitSha` with label **Recorded commit**.
- Submit response/type guards now accept `checkpointSha` and `finalSha` in addition to `commitSha` (including snake_case normalization compatibility from API responses).

### Fail-closed workspace mismatch handling

- Added Day 2/Day 3 repo and codespace identity conflict detection.
- On mismatch, UI intentionally fails closed: no repo/codespace links are shown and a mismatch error is rendered.

### Existing error handling preserved

- Kept explicit handling for `WORKSPACE_NOT_INITIALIZED` provisioning state.
- Kept network-failure messaging path for workspace load/refresh errors.
- Kept `TASK_WINDOW_CLOSED` handling path and callback propagation.

## Files changed

### API / types

- `src/features/candidate/api/tasks.ts`
- `src/features/candidate/api/types.ts`
- `src/features/candidate/session/task/types.ts`
- `src/features/candidate/session/task/utils/taskGuards.ts`

### Controller / view wiring

- `src/features/candidate/session/hooks/useCandidateSessionController.ts`
- `src/features/candidate/session/CandidateSessionView.tsx`
- `src/features/candidate/session/views/types.ts`
- `src/features/candidate/session/views/RunningView.tsx`
- `src/features/candidate/session/views/WorkspaceAndTests.tsx`
- `src/features/candidate/session/views/components/RunningPanelsSection.tsx`
- `src/features/candidate/session/views/sections/WorkspaceSection.tsx`

### Task UI / workspace / submit status

- `src/features/candidate/session/task/components/WorkspacePanel.tsx`
- `src/features/candidate/session/task/components/WorkspacePanelHeader.tsx`
- `src/features/candidate/session/task/components/WorkspacePanelBody.tsx`
- `src/features/candidate/session/task/components/TaskStatus.tsx`
- `src/features/candidate/session/task/CandidateTaskView.tsx`
- `src/features/candidate/session/task/hooks/useSubmitHandler.ts`
- `src/features/candidate/session/task/hooks/useTaskSubmitController.ts`
- `src/features/candidate/session/task/utils/codingWorkspace.ts`
- `src/features/candidate/session/task/utils/loadWorkspaceStatus.ts`
- `src/features/candidate/session/task/utils/submissionStatus.ts`

### Tests

- `tests/unit/features/candidate/session/CandidateSessionPage.workspaceFlow.integration.test.tsx`
- `tests/unit/features/candidate/session/task/CandidateTaskView.test.tsx`
- `tests/unit/features/candidate/session/task/TaskStatus.test.tsx`
- `tests/unit/features/candidate/session/task/WorkspacePanel.test.tsx`
- `tests/unit/features/candidate/session/task/hooks/useSubmitHandler.test.tsx`
- `tests/unit/features/candidate/session/task/utils/codingWorkspace.test.ts`
- `tests/unit/features/candidate/session/task/utils/submissionStatus.test.ts`
- `tests/unit/candidateApi.test.ts`

## Testing

- `npm test -- tests/unit/features/candidate/session/CandidateSessionPage.workspaceFlow.integration.test.tsx tests/unit/features/candidate/session/task/CandidateTaskView.test.tsx` -> PASS (`2` suites, `16` tests)
- `npm run lint` -> PASS
- `npm run typecheck` -> PASS
- `npm test` -> PASS (`234` suites passed, `1453` tests passed)
- `npm run build` -> PASS
- `./precommit.sh` -> PASS (lint + `test:ci` + coverage gate + typecheck + build)

## Acceptance criteria coverage

1. Day 2 and Day 3 display identical repo link and repo name.
   Implemented via shared `codingWorkspace` normalization and lifted state; both coding-day panels consume the same workspace identity.

2. Day 2 submit shows checkpoint state; Day 3 submit shows final state.
   Implemented via `resolveCodingSubmissionStatus` day-index semantics and TaskStatus label wiring.

3. Navigating from Day 2 to Day 3 does not change repo/codespace identity.
   Covered by shared workspace merge behavior and integration test validating cross-day navigation continuity.

4. Workspace-not-initialized state remains clear and actionable.
   `WORKSPACE_NOT_INITIALIZED` provisioning flow and actionable refresh/retry UX remain intact.

## Risks / rollout notes

- `#138` integrity callout content/component remains outside this branch; only structural support (`integrityCallout` slot plumbing) exists here.
- Frontend is compatible with backend `tenon-backend#203` SHA fields: `checkpointSha`, `finalSha`, and canonical `commitSha`.
- Workspace mismatch handling is intentionally fail-closed to avoid presenting potentially incorrect repo/codespace links.
- Manual QA in this environment used an isolated SQLite backend DB because local Postgres schema was drifted/incompatible for this setup path.

## Demo checklist

- [ ] Day 2 and Day 3 panels show the same repo and codespace identity.
- [ ] Day 2 submit shows **Checkpoint recorded**.
- [ ] Day 3 submit shows **Final recorded**.
- [ ] Workspace-not-initialized state remains clear/actionable.
- [ ] Workspace mismatch hides misleading repo/codespace links (fail-closed).

## Audit QA (manual / local runtime)

### Verdict

- Manual QA verdict: **PASS**
- Recommendation: **Ready for PR**

### Runtime method

- Real local frontend: `http://localhost:3000`
- Real local backend: `http://127.0.0.1:8000`
- Browser-driven verification via Playwright (`chromium`, headless)
- QA-only helper scripts were used for auth/session setup and deterministic scenario setup
- No product code changes during QA

### Environment

- OS: `Darwin Robels-MacBook-Air-2.local 25.3.0 Darwin Kernel Version 25.3.0: Wed Jan 28 20:53:01 PST 2026; root:xnu-12377.81.4~5/RELEASE_ARM64_T8103 arm64`
- Node: `v25.2.1`
- npm: `11.6.2`
- Python: `Python 3.14.3`
- Poetry: `Poetry (version 2.3.2)`
- Playwright: `1.57.0`
- Frontend SHA: `9446997d3d7bd50640d79d997909fac07baf9c2f`
- Backend SHA: `eca573de620f96d3a390f6edf1b3031bc606ff45`

### Auth / setup notes

- QA used locally generated JWT/JWKS material plus an Auth0-style Next.js test session cookie flow.
- QA used an isolated SQLite backend DB because local Postgres schema in this QA environment was drifted/incompatible for this setup path.
- This DB choice was an environment/setup fallback, not a product-code change.

### Scenario matrix

| Scenario                                   | Result |
| ------------------------------------------ | ------ |
| Day 2 workspace render                     | PASS   |
| Day 2 -> Day 3 shared workspace continuity | PASS   |
| Day 2 submit semantics                     | PASS   |
| Day 3 submit semantics                     | PASS   |
| Workspace not initialized                  | PASS   |
| Mismatch fail-closed                       | PASS   |

### Key observed results

- Day 2 submit returned `201 Created`.
- Day 2 UI displayed **Checkpoint recorded**.
- Day 2 payload included `checkpointSha`.
- UI rendered **Checkpoint SHA**.
- Day 3 submit returned `201 Created`.
- Day 3 UI displayed **Final recorded**.
- Day 3 payload included `finalSha`.
- UI rendered **Final SHA**.

### Evidence paths

- `.qa/issue139/manual_qa_20260308_215718/QA_REPORT.md`
- `.qa/issue139/manual_qa_20260308_215718/artifacts/qa_result.json`
- `.qa/issue139/manual_qa_20260308_215718/screenshots/01_day2_workspace.png`
- `.qa/issue139/manual_qa_20260308_215718/screenshots/02_day3_workspace_same_identity.png`
- `.qa/issue139/manual_qa_20260308_215718/screenshots/03_day2_submit_checkpoint.png`
- `.qa/issue139/manual_qa_20260308_215718/screenshots/04_day3_submit_final.png`
- `.qa/issue139/manual_qa_20260308_215718/screenshots/05_workspace_not_initialized.png`
- `.qa/issue139/manual_qa_20260308_215718/screenshots/06_mismatch_fail_closed.png`
- `.qa/issue139/manual_qa_20260308_215718_sanitized.zip`
