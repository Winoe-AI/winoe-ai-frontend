# Title

Issue #141: Recruiter Candidate Submissions — Day 4 playback + transcript viewer with search

## TL;DR

- Added a dedicated Day 4 handoff evidence section on Candidate Submissions for recruiter playback and transcript review.
- Added HTML5 video playback + download using backend-supplied signed `handoff.downloadUrl`, with a graceful unavailable fallback.
- Added segmented transcript rendering with client-side case-insensitive search, safe tokenized highlighting, match counts, and timestamp click-to-seek.
- Preserved partial artifact failure behavior so warnings surface without blocking other available artifacts.
- Updated handoff API/type normalization for nested and fallback transcript/download fields.
- Final manual/runtime QA verification: PASS (scenarios A–J), evidence-backed.

## Problem

Recruiters could fetch submission artifacts, but Candidate Submissions did not provide a dedicated Day 4 evidence review flow for playback, transcript reading, transcript search, and timestamp-based evidence navigation.

## What changed

- Added a dedicated Day 4 handoff evidence section in recruiter Candidate Submissions (`LatestDay4Handoff`).
- Added HTML5 video playback via signed URL (`handoff.downloadUrl`).
- Added explicit video download action.
- Added transcript processing state UI when transcript segments are not ready.
- Added segmented transcript viewer with formatted timestamps.
- Added client-side transcript search with case-insensitive matching, safe highlighting via tokenized render (no HTML injection path), and match count.
- Added timestamp click-to-seek behavior that seeks the video player to segment start time.
- Preserved partial artifact warning behavior (`Some submission details are unavailable.`) while keeping other artifacts visible.
- Extended type/API normalization for `handoff` payloads, including nested and snake_case/camelCase fallbacks for transcript/download data.

## Important bug fix / follow-up correction

- Removed the incorrect `dayIndex === 4` heuristic that could treat non-handoff Day 4 submissions as handoff evidence.
- Playback/transcript UI now renders only for real handoff artifacts (`type: 'handoff'` or artifact handoff payload present).
- Latest Day 4 evidence now resolves from the latest actual handoff submission, not the latest arbitrary Day 4 submission.
- Manual/runtime QA verified non-handoff Day 4 submissions do not render playback/transcript UI.

## Final QA Verification

- Final status: PR-ready, manual/runtime QA verified: PASS.
- Verification method:
  - Real localhost runtime
  - Frontend: `http://127.0.0.1:3000`
  - Backend: `http://127.0.0.1:8000`
  - Playwright browser automation
  - Local JWKS + session-cookie auth harness
  - Local MinIO signed-media flow
- Evidence bundle:
  - `.qa/issue141/manual_qa_20260311_222235/`
  - `.qa/issue141/manual_qa_20260311_222235.zip`
- Final QA scenario summary: PASS across scenarios A–J, covering:
  - Day 4 handoff evidence section renders correctly.
  - Video playback works from signed URL.
  - Download action works.
  - Fallback works when video becomes unavailable.
  - Transcript processing state is shown without blocking the page.
  - Transcript ready state renders segmented transcript with timestamps.
  - Search is case-insensitive and shows highlights + match count.
  - Timestamp click seeks video correctly.
  - Partial artifact warning preserves successful artifacts.
  - Non-handoff Day 4 submissions do not render playback/transcript UI.
  - No obvious signed URL leakage or persistence was observed in captured frontend QA scope.

## Files changed

Primary implementation files:

- `src/features/recruiter/simulations/candidates/components/ArtifactCard/ArtifactCard.tsx`
- `src/features/recruiter/simulations/candidates/components/ArtifactCard/ArtifactDay4Handoff.tsx` (new)
- `src/features/recruiter/simulations/candidates/components/ArtifactCard/day4Transcript.ts` (new)
- `src/features/recruiter/simulations/candidates/components/CandidateSubmissionsView.tsx`
- `src/features/recruiter/simulations/candidates/components/LatestDay4Handoff.tsx` (new)
- `src/features/recruiter/simulations/candidates/hooks/candidateLoader.ts`
- `src/features/recruiter/simulations/candidates/hooks/computeLatestArtifacts.ts`
- `src/features/recruiter/simulations/candidates/hooks/reloadCandidateSubmissions.ts`
- `src/features/recruiter/simulations/candidates/types.ts`
- `src/features/recruiter/simulations/candidates/utils/candidateSubmissionsApi.ts`
- `src/features/recruiter/simulations/candidates/utils/handoff.ts` (new)
- `src/features/recruiter/simulations/candidates/utils/pickLatest.ts`

Test coverage added/updated:

- `tests/unit/features/recruiter/candidate-submissions/ArtifactDay4Handoff.test.tsx` (new)
- `tests/unit/features/recruiter/candidate-submissions/day4Transcript.test.ts` (new)
- `tests/unit/features/recruiter/candidate-submissions/computeLatestArtifacts.test.ts` (new)
- `tests/integration/recruiter/simulations/candidates/CandidateSubmissionsContent.test.tsx`
- `tests/unit/features/recruiter/candidate-submissions/CandidateSubmissionsPage.test.tsx`

## Testing

Implementation validation (passed):

- `npm run lint` -> PASS
- `npm run typecheck` -> PASS
- `npm run build` -> PASS
- `npm test -- --runInBand tests/unit/features/recruiter/candidate-submissions` -> PASS

QA validation (manual/runtime):

- Playwright-backed localhost runtime QA completed with overall verdict: PASS.
- Final QA pass produced PASS across scenarios A–J.
- Evidence: `.qa/issue141/manual_qa_20260311_222235/` and `.qa/issue141/manual_qa_20260311_222235.zip`.

## Manual QA / screenshots

- Manual browser/runtime QA was performed for this issue.
- Screenshots and supporting artifacts exist in the issue-scoped QA bundle:
  - `.qa/issue141/manual_qa_20260311_222235/screenshots/`
  - `.qa/issue141/manual_qa_20260311_222235/artifacts/`

## Risks / assumptions

- Latest-handoff prefetch depends on submissions-list contract correctness for identifying handoff records via `type: 'handoff'`.
- Signed playback/download URLs are ephemeral and intentionally not persisted in long-lived client storage.

## Rollout / demo checklist

- [ ] Recruiter opens candidate submission.
- [ ] Recruiter sees latest Day 4 handoff evidence section.
- [ ] Recruiter plays Day 4 video.
- [ ] Recruiter downloads Day 4 video.
- [ ] Recruiter searches transcript and sees highlighted matches + count.
- [ ] Recruiter clicks transcript timestamp and video seeks correctly.
- [ ] Recruiter sees processing/fallback states when transcript or video artifacts are unavailable.

## Status

- PR-ready.
- Manual/runtime QA verified: PASS.
