## Summary

- Replaced Day 4 Talent Partner review copy from legacy "presentation" wording to **Handoff + Demo** terminology.
- Updated affected tests to assert the new Day 4 Handoff + Demo copy.
- Verified frontend handoff clients use the handoff endpoint family and no active `/presentation/upload/*` references remain.

## Files Changed

- `src/features/talent-partner/submission-review/components/LatestDay4Handoff.tsx`
- `src/features/talent-partner/submission-review/components/ArtifactCard/ArtifactDay4Handoff.tsx`
- `tests/integration/talent-partner/trials/candidates/CandidateSubmissionsContent.day4Handoff.test.tsx`
- `tests/unit/features/talent-partner/submission-review/ArtifactDay4Handoff.test.tsx`

## Route Verification

Frontend request clients inspected:

- `src/features/candidate/tasks/handoff/handoffApi.requests.init.ts`
  - uses `/tasks/{taskId}/handoff/upload/init`
- `src/features/candidate/tasks/handoff/handoffApi.requests.complete.ts`
  - uses `/tasks/{taskId}/handoff/upload/complete`
- `src/features/candidate/tasks/handoff/handoffApi.requests.status.ts`
  - uses `/tasks/{taskId}/handoff/status`

Backend runtime OpenAPI verification:

- Present:
  - `/api/tasks/{task_id}/handoff/status`
  - `/api/tasks/{task_id}/handoff/upload/complete`
  - `/api/tasks/{task_id}/handoff/upload/init`
- Absent:
  - `/presentation/upload/*`

## QA Evidence

### Automated / code checks

- Targeted Day 4 handoff tests passed:
  - `tests/integration/talent-partner/trials/candidates/CandidateSubmissionsContent.day4Handoff.test.tsx`
  - `tests/unit/features/talent-partner/submission-review/ArtifactDay4Handoff.test.tsx`
  - `tests/unit/features/candidate/tasks/handoff/HandoffUploadPanel.day4Requirements.test.tsx`
- Grep checks passed:
  - zero `/presentation/upload` hits in frontend source/tests
  - zero `presentationUpload|PresentationUpload` hits in frontend source/tests
  - zero active Day 4 user-facing "presentation" copy hits
- `npm run lint` passed
- `npm run typecheck` passed
- `npm run build` passed
- `./precommit.sh` passed:
  - 503/503 test suites passed
  - 1573/1573 tests passed
  - coverage passed
  - typecheck passed
  - build passed

### Manual browser QA

Backend:
- `./runBackend.sh api` started successfully
- `GET /health` returned `200 OK`
- live OpenAPI exposed handoff routes and no presentation upload routes

Frontend:
- `npm run dev` started successfully on `http://localhost:3000`

Talent Partner browser QA:
- login succeeded for the provided Talent Partner account
- reached:
  - `/dashboard`
  - `/dashboard/trials/2`
  - `/dashboard/trials/2/candidates/1`
- Day 4 review surface reached
- observed **Handoff + Demo** copy:
  - `Day 4 Handoff + Demo evidence`
  - `Playback and transcript review for the latest Day 4 Handoff + Demo`
- no visible Day 4 "presentation" copy observed
- no `/presentation/upload/*` network requests observed
- no relevant console errors observed

Candidate browser QA:
- login succeeded for the provided Candidate account
- reached:
  - `/candidate/dashboard`
  - `/candidate/session/OklvcvQxuQIIxzcmdrXxNK5i0Jl07GHokd6zG7KHqD8`
- candidate session remained on Day 1
- Day 4 upload surface was not reachable because backend state did not advance to Day 4 during QA
- no visible Day 4 "presentation" copy observed
- no `/presentation/upload/*` network requests observed

## Known Limitation

Candidate Day 4 upload browser proof was not completed because the local seeded/backend state kept the candidate session on Day 1. The schedule endpoint rejected backdating, and the admin day-window control returned `ok` but did not move `currentTask` to Day 4.

This is an environment/seed-state limitation, not a #192 implementation defect. The API client source, backend OpenAPI contract, targeted tests, Talent Partner Day 4 browser review, and full precommit gate all support the #192 acceptance criteria.

## Risk

Low. The only incomplete proof is live Candidate Day 4 upload UI access under local seeded state. The upload client route strings are directly verified in source and backend OpenAPI confirms the matching handoff endpoints exist while legacy presentation upload endpoints do not.

## Final Status

Fixes #192
