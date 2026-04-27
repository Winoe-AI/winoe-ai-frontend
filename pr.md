# PR: Implement candidate start-date scheduling UI

## Linked Issue

- Winoe-AI/winoe-ai-frontend issue #181

## Summary

This PR implements the candidate start-date scheduling UI after invite claim/session bootstrap. It shows "Pick your start date", detects and displays the candidate timezone with a UTC fallback, renders a 5-day Trial preview, rejects past dates client-side, requires a GitHub username before scheduling, requires confirmation before schedule submission, and shows a locked countdown after scheduling.

The scheduling and locked states prevent Trial content from appearing before Day 1 opens. The copy also preserves from-scratch terminology and avoids retired terms.

## Acceptance Criteria

- [x] Pick your start date shown after invite claim/session bootstrap
- [x] Timezone-aware date picker with 5-day preview
- [x] Past dates rejected with clear message
- [x] Confirmation step before finalizing
- [x] After scheduling: countdown with date, time, and timezone
- [x] No Trial content visible before Day 1 opens

## Implementation Notes

Key implementation areas:

- `src/features/candidate/session/views/SchedulingView.tsx`
- `src/features/candidate/session/views/SchedulingFormStep.tsx`
- `src/features/candidate/session/views/SchedulingConfirmStep.tsx`
- `src/features/candidate/session/views/LockedView.tsx`
- `src/features/candidate/session/views/LockedViewCountdownCard.tsx`
- `src/features/candidate/session/views/LockedViewDayWindows.tsx`
- `src/features/candidate/session/hooks/controller/useCandidateSessionSchedule.ts`
- `src/features/candidate/session/hooks/controller/useCandidateSessionScheduleDraft.ts`
- `src/features/candidate/session/api/scheduleApi.ts`
- candidate session route/controller prop plumbing
- focused tests and fixture updates

`githubUsername` remains required by validation and by `scheduleApi.ts`.

## QA Evidence

### Environment

- Backend API was already listening on `:8000`; `/health` returned `{"status":"ok"}`
- Backend worker started with `bash scripts/local_qa_backend.sh worker`
- Frontend started with `./runFrontend.sh`
- Next served `http://localhost:3000` with `.env.local`
- `FRONTEND_QA_PLAYBOOK.md` was not present, so repo README/local dev guidance was followed

### Session Path

- Supplied Candidate account: `robiemelaku@gmail.com`
- Supplied Talent Partner account: `robel.kebede@bison.howard.edu`
- Local backend had no existing trials/invites for supplied accounts
- A backend Trial was created, but live invite/session setup was blocked by backend `scenario_generation_llm_failed`
- Browser QA used a Playwright-authenticated candidate session with routed `/api/backend/candidate/session/...` responses
- This verified the real frontend scheduling UI, validation, confirmation, locked state, direct navigation behavior, and schedule request payload
- A true live backend schedule mutation was not verified because of the backend scenario-generation blocker

### Browser QA Results

- PASS: "Pick your start date" shown after candidate session bootstrap; no automatic Day 1 content
- PASS: timezone field populated as `America/New_York`
- PASS: 5-day preview shown with:
  - Day 1 - Planning & Design Doc
  - Day 2 - Implementation Kickoff
  - Day 3 - Implementation Wrap-Up
  - Day 4 - Handoff + Demo
  - Day 5 - Reflection Essay
- PASS: past date `2026-04-26` rejected with `Start date cannot be in the past.`
- PASS: Continue disabled / blocked for invalid past date
- PASS: no schedule request sent for invalid past date
- PASS: blank GitHub username blocked with `Enter your GitHub username.`
- PASS: no schedule request sent until username was valid
- PASS: confirmation step shown before submission
- PASS: schedule request count stayed 0 until `Confirm schedule`
- PASS: after confirmation, locked/countdown state shown with date, time, timezone, and "Come back then"
- PASS: direct navigation back to `/candidate/session/qa-issue-181-schedule-token-0001` still showed locked state
- PASS: locked state did not expose Project Brief, scenario, repository URL, Codespace URL, Day 1 editor, Start Trial, current task, or Trial work content
- PASS: no forbidden terms visible in scheduling/locked surfaces:
  - Tenon
  - SimuHire
  - recruiter
  - simulation
  - Fit Profile
  - Fit Score
  - template
  - precommit
  - Specializor
  - existing codebase
  - read-only repository exploration
  - offline/local work

### Network/API Evidence

Schedule POST endpoint observed:

```text
/api/backend/candidate/session/qa-issue-181-schedule-token-0001/schedule
```

Payload:

```json
{
  "scheduledStartAt": "2026-04-29T13:00:00Z",
  "candidateTimezone": "America/New_York",
  "githubUsername": "octocat"
}
```

This matches 9:00 AM America/New_York on April 29, 2026 converted to UTC.

### Screenshots

- `qa_verifications/issue-181-manual-qa/screenshots/01-scheduling-form.png`
- `qa_verifications/issue-181-manual-qa/screenshots/02-five-day-preview.png`
- `qa_verifications/issue-181-manual-qa/screenshots/03-confirmation-step.png`
- `qa_verifications/issue-181-manual-qa/screenshots/04-locked-countdown.png`

## Test / Command Evidence

- PASS `npm run typecheck`
- PASS `npm run lint:eslint`
- PASS `npm run lint:prettier`
- PASS `npm run build`
- PASS `npm test -- --runInBand tests/unit/features/candidate/session/CandidateSessionView.windowGating.test.tsx`
- PASS `npm test -- --runInBand tests/unit/features/candidate/session/CandidateSessionView.schedule.test.tsx tests/integration/candidate/CandidateSessionPageClient.behavior.scheduleSuccess.test.tsx tests/integration/candidate/CandidateSessionPageClient.behavior.scheduleValidation.test.tsx tests/integration/candidate/CandidateSessionPageClient.behavior.lockedProxy.test.tsx tests/unit/candidateApi.schedule.test.ts`
- PASS `git diff --check`
- PASS `./precommit.sh`
  - lint passed
  - full `test:ci` passed: 498 suites, 1533 tests
  - coverage passed
  - typecheck passed
  - build passed

## Known Limitations / Follow-up

- Live full-stack invite/session scheduling mutation was not verified because local backend Trial setup was blocked by `scenario_generation_llm_failed`.
- Frontend behavior and schedule POST payload were verified with Playwright-routed backend responses.
- Backend #288 remains the upstream source-of-truth dependency for final production contract behavior and Talent Partner notification.

## PR Risk

Risk is low on frontend UI behavior because focused tests, integration tests, browser QA, and full precommit are green.

Remaining risk is integration-only: backend scenario generation/local invite setup blocked true live backend schedule mutation verification.
