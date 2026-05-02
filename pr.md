## Summary

- Restore the completed candidate Trial experience after Day 5.
- Add the post-Trial congratulations screen metadata: Trial name, company, and authoritative completion date.
- Restore the completed read-only submission review page with all five day sections.
- Harden review rendering so missing artifacts show explicit unavailable/empty states instead of crashing.
- Fix completion-date sourcing so the completion card uses authoritative `completedAt`, not stale local submission timestamps.
- Stabilize contract-live QA harness/runtime enough to verify #187 end to end.

## Issue

Closes #187

## What Changed

### Candidate completion screen

- Shows Trial name, company, and completion date after Day 5 completion.
- Uses authoritative completion timestamp from completed task/session state.
- Removes stale submission timestamp fallback from the completion-date display.
- Keeps “Review submissions” and “Back to Candidate Dashboard” actions.

### Read-only completed review

- Renders a read-only completed Trial review route.
- Shows Trial metadata and completion date.
- Renders the five-day Trial sequence:
  - Day 1 — Design Doc
  - Day 2 — Implementation Kickoff
  - Day 3 — Implementation Wrap-Up
  - Day 4 — Handoff + Demo
  - Day 5 — Reflection Essay
- Renders markdown content for Day 1 and Day 5.
- Renders workspace metadata, commit history, and test results for Day 2/3 when available.
- Shows explicit unavailable states when commit history or test results are missing.
- Renders Day 4 recording/transcript when available, with graceful unavailable states.
- Prevents editable controls from appearing in completed review.

### Data/state handling

- Normalizes completed review and current task completion data.
- Carries `completedAt` through candidate session state.
- Prefers authoritative task/session completion timestamp over stale bootstrap/local storage data.
- Handles missing/snake_case backend fields safely.

### QA harness

- Stabilized contract-live local runtime host handling around `127.0.0.1`.
- Ensured worker/frontend/backend startup is deterministic for contract-live.
- Captures Day 5 completion and review page artifacts.

## Verification

### Automated checks

- `./precommit.sh` — PASS
- Frontend test suite — PASS
  - `508 passed, 508 total`
  - `1589 passed, 1589 total`
- Typecheck — PASS
- Build — PASS
- Prettier check — PASS
- Harness syntax check — PASS
- Terminology audit — PASS, no retired candidate UI copy found

### Contract-live QA

Command:

```bash
CONTRACT_LIVE_DRIVER_SEQUENCE='talent_partner-fresh,candidate-schedule,candidate-day:1,candidate-day:2,candidate-day:3,candidate-day:4,candidate-day:5,talent_partner-review' bash qa_verifications/Contract-Live-QA/run_contract_live.sh
```

Result: PASS

Evidence bundle:

```text
qa_verifications/Contract-Live-QA/contract_live_qa_latest/artifacts/20260502T143652/
```

Key artifacts:

- `api/candidate-day5-after.json`
- `candidate-day5-after.png`
- `api/candidate-day5-current-task-after.json`
- `api/candidate-review-page.json`
- `candidate-review-page.png`

Completion-date verification:

- Day 5 completion card: `May 5, 2026`
- Read-only review page: `May 5, 2026`
- Authoritative `completedAt`: `2026-05-05T13:00:00Z`

## QA Checklist

- [x] After Day 5 completion: congratulations screen
- [x] Shows Trial name, company, completion date
- [x] Review submissions navigates to read-only review
- [x] Each day viewable but not editable
- [x] Day 1 design doc markdown rendered
- [x] Day 2/3 repo metadata, commit history, test results or unavailable states
- [x] Day 4 video playback/transcript if available or graceful fallback
- [x] Day 5 reflection essay markdown rendered
- [x] No editable controls on review page

## Known Caveat

Contract-live now uses API/bootstrap shortcuts for some intermediate setup to keep the local end-to-end run deterministic. This PR should not be used as proof that the full candidate scheduling click path is covered in browser. For #187, the relevant browser surfaces - Day 5 completion, review navigation, and read-only completed review - were verified against real backend data.

## Risk

Low-to-medium.

Main risk is around candidate session completion state and backend payload variance. This is mitigated by:

- defensive frontend normalization,
- explicit empty/unavailable states,
- unit coverage for stale completion-date handling,
- full precommit passing,
- successful contract-live verification of the completed Trial path.
