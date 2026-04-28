# Complete Day 4 Handoff + Demo upload flow

## Summary

This PR completes the Day 4 candidate Handoff + Demo UI for issue #185.

Core implementation:

- Max 15-minute demo video duration validation before upload.
- Browser preview before finalization.
- Resubmit flow before cutoff, with the latest valid submission used.
- Optional supplemental materials upload through the backend signed URL flow.
- Transcript status rendering for not-started, processing, ready, and failed states.
- Day 4 9 AM-5 PM local window messaging and countdown.
- Handoff + Demo terminology cleanup.
- Backend endpoint alignment from stale `/presentation/upload/*` paths to current `/handoff/*` paths.
- Countdown fallback from `currentWindow.windowEndAt` when `currentTask.cutoffAt` is unavailable.

## Product / Terminology Notes

User-facing copy follows Winoe AI terminology:

- Trial
- Candidate
- Handoff + Demo
- demo video
- supplemental materials
- Evidence Trail
- Winoe Score / Winoe Report only where relevant

Touched candidate-facing Day 4 surfaces avoid retired terms:

- presentation
- recruiter
- simulation
- Fit Profile
- Fit Score
- Tenon
- SimuHire
- template
- starter code
- precommit
- Specializor
- existing codebase
- offline/local work

Backend route/function names or internal component names may still have legacy words only where they are not candidate-facing and are outside this issue's scope.

## Acceptance Criteria Checklist

- [x] Video upload with max 15-minute duration enforcement
- [x] Preview capability before final submission
- [x] Resubmit allowed until Day 4 cutoff, with most recent submission used
- [x] Optional supplemental materials upload
- [x] Transcript processing status indicator
- [x] All copy uses Handoff + Demo, not presentation, in touched Day 4 candidate-facing surfaces
- [x] Day 4 window: 9 AM-5 PM local with countdown

## QA Evidence

### Manual QA Environment

- Frontend branch/commit: `feature/complete-day4-handoff-demo-ui-video-upload-preview-resubmit-and-transcript-status`, base `7513383c2acd20b958d784afa25b6301ddd840f1` plus local QA fixes
- Backend branch/commit: `main`, `7cefc1f213b1b5e0b8b547ad615c8b390d92eef3`
- Frontend URL: `http://localhost:3000`
- Backend URL: `http://localhost:8000`
- Browser: Playwright Chromium, headless
- Backend startup:
  - `bash scripts/local_qa_backend.sh migrate`
  - `bash scripts/local_qa_backend.sh`
  - `curl -sS http://localhost:8000/health`
  - `curl -sS http://localhost:8000/ready`
- Frontend startup:
  - `./runFrontend.sh`
- Note: `FRONTEND_QA_PLAYBOOK.md` was not found under `/Users/robelmelaku/Desktop/Winoe-AI`; README/run scripts were used as fallback.

### Manual QA Test Data

- Candidate account used: `robiemelaku@gmail.com`
- Talent Partner local DB user: `robel.kebede@bison.howard.edu`
- Trial/session: Trial `13`, candidate session `12`, token `issue185-day4-qa-final-20260428`, Day 4 task `64`
- Setup: local backend DB setup created Trial, CandidateSession, Day 1-3 submissions, Day 4 windows, and transcript/window states for scenario coverage
- Media fixtures:
  - `/tmp/winoe-day4-valid-demo.mp4` - `5.000000s`
  - `/tmp/winoe-day4-valid-demo-2.mp4` - `6.000000s`
  - `/tmp/winoe-day4-too-long-demo.mp4` - `901.000000s`
  - `/tmp/winoe-day4-architecture-notes.pdf` - valid 1-page PDF

### Manual QA Results

- PASS: Candidate reached Day 4 Handoff + Demo open state.
- PASS: Long 901s video was blocked before upload/init.
- PASS: Valid video uploaded after browser duration validation.
- PASS: Preview appeared before finalization.
- PASS: Supplemental PDF uploaded via signed URL and persisted.
- PASS: Resubmit before cutoff worked; latest DB submission pointed to second recording.
- PASS: Transcript not-started, processing, ready, and failed states rendered.
- PASS: Closed and before-open states blocked upload/resubmit.
- PASS: Runtime terminology scan was clean.
- PASS: Candidate progress remained X/5, not X/10.
- PASS: No failed network requests or console errors during the final happy path.

Key backend/network evidence:

- Demo init body: `{"contentType":"video/mp4","sizeBytes":5992,"filename":"winoe-day4-valid-demo.mp4","durationSeconds":5}`
- Demo signed upload: `PUT http://localhost:8000/api/recordings/storage/fake/upload?...durationSeconds=5` -> `204`
- Demo complete: `POST /api/backend/tasks/64/handoff/upload/complete`, body `{"recordingId":"rec_17"}` -> `200`
- Supplemental init body: `{"contentType":"application/pdf","sizeBytes":378,"filename":"winoe-day4-architecture-notes.pdf","assetType":"supplemental"}`
- Supplemental signed upload -> `204`
- Supplemental complete: `{"recordingId":"rec_18"}` -> `200`
- Resubmit complete: `{"recordingId":"rec_19"}` -> `200`
- Latest DB evidence: recordings `17` and `19`; task submission points to `19`; supplemental material `18` persisted

Screenshots/evidence paths:

- `qa_verifications/issue185/final-a-open.png`
- `qa_verifications/issue185/final-b-invalid.png`
- `qa_verifications/issue185/final-c-preview.png`
- `qa_verifications/issue185/final-d-after-finalize.png`
- `qa_verifications/issue185/final-e-after-resubmit.png`
- `qa_verifications/issue185/final-f-processing.png`
- `qa_verifications/issue185/final-f-ready.png`
- `qa_verifications/issue185/final-f-failed.png`
- `qa_verifications/issue185/final-g-closed.png`
- `qa_verifications/issue185/final-g-before-open.png`
- `qa_verifications/issue185/final-countdown-after-fix.png`
- `qa_verifications/issue185/final-manual-qa-evidence.json`

## Bugs Found and Fixed During QA

1. BLOCKING - fixed
   - Frontend was calling stale `/presentation/upload/*` endpoints.
   - Backend returned 404 for status/init.
   - Fixed to current `/handoff/status` and `/handoff/upload/{init,complete}` endpoints.

2. NON-BLOCKING - fixed
   - Completed-review copy said `Demo presentation recording`.
   - Changed to `Handoff + Demo recording`.

3. NON-BLOCKING - fixed
   - Handoff panel did not use `currentWindow.windowEndAt` when `currentTask.cutoffAt` was null.
   - Added fallback during task transform so countdown appears from the backend window end.

## Backend Boundary / Risks

- Backend #290 remains the broader media/transcript pipeline dependency, but this frontend now uses the available backend signed-upload contract for demo and supplemental materials.
- Backend #287 enforcement is backend-side. Frontend renders failed transcript status and retry guidance; it does not own Winoe scoring enforcement.
- QA set transcript processing/ready/failed states through local DB setup to cover state rendering, then verified through the real backend/frontend.

## Automated Validation

- PASS `npm test -- --runInBand tests/unit/features/candidate/tasks/handoff`
- PASS `npm test -- --runInBand tests/unit/features/candidate/tasks/utils/day5Reflection.test.ts`
- PASS `npm run typecheck`
- PASS `npm run lint:eslint`
- PASS `npm run lint:prettier`
- PASS `npm run build`
- PASS `./precommit.sh`

Precommit summary:

- 501 suites passed
- 1558 tests passed
- Coverage check passed
- Typecheck passed
- Build passed

QA PASS — issue #185 is ready for PR review.
