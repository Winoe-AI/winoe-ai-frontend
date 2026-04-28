# PR: Fix Day 3 Implementation Wrap-Up UI

## Summary

- Reframed Day 3 candidate UI from stale debugging exercise language to `Implementation Wrap-Up`.
- Normalized stale Day 3 backend task copy client-side so candidate-facing UI always shows the correct v4 from-scratch model.
- Preserved same Codespace/repository continuation from Day 2.
- Preserved existing submit/final SHA behavior.
- Added/updated focused tests for Day 3 copy, CTA, stale `debug` leakage, and submit feedback.

## Product Behavior

- Day 3 now shows `Implementation Wrap-Up`.
- Day 3 displays safe task type/copy instead of stale `debug`.
- Day 3 guides candidates to finish the build, improve tests, handle edge cases, optimize, document, and prepare for handoff.
- Day 3 reinforces Codespace-only implementation work.
- Day 3 submit uses `Submit Implementation Wrap-Up`.
- Progress remains X/5.

## Files Changed

- `src/features/candidate/tasks/utils/day3ImplementationWrapUpUtils.ts`
- `src/features/candidate/session/api/tasksNormalizeApi.ts`
- `src/features/candidate/session/utils/taskTransformsUtils.ts`
- `src/features/candidate/tasks/CandidateTaskViewInner.tsx`
- `src/features/candidate/tasks/components/TaskActions.tsx`
- `src/features/candidate/tasks/components/TaskWorkArea.tsx`
- `src/features/candidate/tasks/components/progress/daySummaries.ts`
- `tests/e2e/flow-qa/candidate-day3.spec.ts`
- `tests/unit/features/candidate/tasks/CandidateTaskProgress.test.tsx`
- `tests/unit/features/candidate/tasks/components/TaskActions.test.tsx`
- `tests/unit/features/candidate/tasks/CandidateTaskView.day3ImplementationWrapUp.test.tsx`
- `tests/unit/features/candidate/tasks/CandidateTaskView.submitFeedback.test.tsx`

## QA Evidence

### Environment

Backend:

- PASS `./runBackend.sh migrate`
- PASS `./runBackend.sh bootstrap-local`
- Runtime: `WINOE_SCENARIO_GENERATION_RUNTIME_MODE=demo WINOE_DEMO_MODE=1 ./runBackend.sh`

Frontend:

- Runtime: `./runFrontend.sh`

URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

Health:

- PASS backend `/health`
- PASS frontend `/api/health`

Browser/tool:

- Playwright Chromium

### Account / Session

- Candidate account used: `robiemelaku@gmail.com`
- Talent Partner account used for local Trial API setup: `robel.kebede@bison.howard.edu`
- QA Trial: `Issue 184 Day 3 QA Trial Demo`
- Trial id: `3`
- Candidate session id: `1`

### Acceptance Criteria Evidence

AC1 Day 3 title: PASS

- Visible text: `Day 3 • code`
- Visible title: `Implementation Wrap-Up`
- No `Debugging Exercise`

AC2 same Codespace/repo: PASS

- Day 2 and Day 3 both showed repo `winoe-ai-repos/winoe-ws-1`
- Day 2 and Day 3 both showed Codespace `https://vigilant-orbit-jjwrrq6r467j2j7ww.github.dev`

AC3 wrap-up guidance: PASS

- Copy includes finish core build, improve test coverage, handle edge cases, optimize, add/improve documentation, and prepare for handoff.

AC4 Codespace-only constraints: PASS

- Visible copy includes `Day 2 and Day 3 implementation work must happen in GitHub Codespaces only`
- Visible copy includes `All coding work must happen inside the Codespace`

AC5 submit/final SHA behavior: PASS

- Day 3 submit returned `finalSha: "68b2650911ea1dedd050c2360e34096b74f3dc23"`
- Progress advanced to `3/5`

AC6 forbidden terminology absent: PASS for candidate-facing Day 3 DOM

- DOM scan found none of the forbidden Day 3 terms.
- Code scan found only internal/test compatibility occurrences.

AC7 5-day Trial framing: PASS

- UI showed `2/5 complete` before Day 3 submit.
- UI showed `3/5 complete` after Day 3 submit.
- No X/10 task framing.

### QA Artifacts

- `/tmp/winoe-issue-184-day3-qa/09-day3-active-ui.png`
- `/tmp/winoe-issue-184-day3-qa/10-day3-after-submit.png`
- `/tmp/winoe-issue-184-day3-qa/day3-active-network-responses.json`
- `/tmp/winoe-issue-184-day3-qa/day3-submit-responses.json`

## Automated Checks

- PASS `npm test -- CandidateTaskView.submitFeedback.test.tsx --runInBand`
- PASS `npm test -- CandidateTaskView.day3ImplementationWrapUp.test.tsx --runInBand`
- PASS `npm run lint`
- PASS `npm run typecheck`
- PASS `npm run lint:prettier`
- PASS `./precommit.sh`
  - 500 Jest suites passed
  - 1552 tests passed
  - coverage gate passed
  - typecheck passed
  - production build passed

## Risk / Rollback

- Risk is low.
- The frontend still accepts stale backend Day 3 payloads, including `type: "debug"`, but normalizes candidate-facing Day 3 display to the correct Implementation Wrap-Up model.
- No backend contract changes.
- Existing final SHA behavior preserved.
- Rollback: revert the Day 3 normalization/copy changes and test updates.

Fixes #184
