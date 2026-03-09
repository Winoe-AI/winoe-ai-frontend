# Title

Issue #138: Integrity Messaging and Cutoff Evaluation Basis (Frontend)

## TL;DR

- Added shared `IntegrityCallout` messaging for cutoff-based evaluation.
- Wired candidate Day 2/Day 3 UI to show cutoff SHA/time after cutoff and keep pre-cutoff copy accurate.
- Wired recruiter artifact view to show the same evaluation-basis cutoff messaging.
- Enabled cutoff-aware closed/disabled states for candidate run/submit UX.
- Ensured cutoff field normalization and `toTask()` propagation of `cutoffCommitSha` / `cutoffAt`.
- Verified end-to-end runtime behavior with local frontend + backend + Playwright; final QA verdict is PASS.

## Problem / Context

MVP1 integrity guarantee is: only commits pushed before cutoff count. The UI must communicate this clearly and, after cutoff is recorded, show the immutable cutoff commit SHA used as the evaluation basis.

Frontend consumes backend-authoritative cutoff fields (`cutoffCommitSha`, `cutoffAt`) and does not infer cutoff state from non-authoritative signals.

## What Changed

- Added shared `IntegrityCallout`.
- Integrated `IntegrityCallout` into candidate Day 2 / Day 3 session surfaces.
- Integrated `IntegrityCallout` into recruiter artifact surfaces.
- Added cutoff-aware closed/disabled wiring for candidate run tests and submit actions.
- Added/updated cutoff normalization support in candidate runtime API adapters.
- Confirmed `toTask()` preserves `cutoffCommitSha` / `cutoffAt`.
- Corrected pre-cutoff messaging so evaluation-basis language appears only post-cutoff.
- Runtime now receives backend cutoff contract fields and activates UI states correctly.

## Acceptance Criteria Mapping

1. Candidate sees cutoff SHA after cutoff enforcement.

- Implemented: candidate post-cutoff callout shows `Cutoff commit` with link and cutoff time.

2. Attempting to run/submit shows closed state.

- Implemented: post-cutoff candidate state shows `Day closed` and disables run/submit paths with closed-state reasoning.

3. Copy consistently reflects the rule.

- Implemented: shared copy states that only pre-cutoff commits are evaluated, post-cutoff work is ignored, and evaluation is based on the shown commit.

4. Recruiter evidence view shows cutoff SHA evaluation basis.

- Implemented: recruiter artifact view shows cutoff SHA, cutoff link, and evaluation-basis text after cutoff.

## Files / Areas Touched

Candidate API / normalization / types:

- `src/features/candidate/api/tasksNormalize.ts`
- `src/features/candidate/api/workspace.ts`
- `src/features/candidate/api/types.ts`
- `src/features/candidate/session/state/types.ts`
- `src/features/candidate/session/task/types.ts`
- `src/features/candidate/session/utils/taskTransforms.ts`

Candidate UI:

- `src/features/candidate/session/views/WorkspaceAndTests.tsx`
- `src/features/candidate/session/task/components/WorkspacePanel.tsx`
- `src/features/candidate/session/task/components/WorkspacePanelBody.tsx`
- `src/features/candidate/session/task/hooks/useTaskSubmitController.ts`

Recruiter UI:

- `src/features/recruiter/simulations/candidates/components/ArtifactCard/ArtifactCard.tsx`
- `src/features/recruiter/simulations/candidates/types.ts`
- `src/features/recruiter/simulations/candidates/utils/candidateSubmissionsApi.ts`

Shared UI:

- `src/shared/ui/IntegrityCallout.tsx`
- `src/shared/ui/index.ts`

Tests:

- `tests/unit/features/candidate/session/utils/taskTransforms.test.ts`
- `tests/unit/features/candidate/taskTransforms.test.ts`
- `tests/unit/shared/ui/IntegrityCallout.test.tsx`
- `tests/unit/features/candidate/session/views/WorkspaceAndTests.test.tsx`
- `tests/unit/features/candidate/session/task/WorkspacePanel.test.tsx`
- `tests/unit/features/recruiter/candidate-submissions/ArtifactCard.test.tsx`
- `tests/unit/features/recruiter/candidate-submissions/CandidateSubmissionsPage.extra.test.tsx`
- `tests/unit/lib/api/candidate.test.ts`

## Testing

- `npm run lint` -> PASS
- `npm run typecheck` -> PASS
- `npm test` -> PASS (`236` suites, `1468` tests)

## Manual Runtime QA

- Method: local frontend + local backend + Playwright scenario verification.
- Evidence bundle: `.qa/issue138/manual_qa_20260309_101810_final/`
- Verdict: PASS
- Scenario results:
  - Candidate pre-cutoff: PASS
  - Candidate post-cutoff: PASS
  - Recruiter pre-cutoff: PASS
  - Recruiter post-cutoff: PASS
- Key evidence:
  - `.qa/issue138/manual_qa_20260309_101810_final/QA_REPORT.md`
  - `.qa/issue138/manual_qa_20260309_101810_final/artifacts/qa_result.json`
  - `.qa/issue138/manual_qa_20260309_101810_final/screenshots/01_candidate_pre_cutoff_state.png`
  - `.qa/issue138/manual_qa_20260309_101810_final/screenshots/02_candidate_post_cutoff_sha.png`
  - `.qa/issue138/manual_qa_20260309_101810_final/screenshots/03_candidate_post_cutoff_disabled_actions.png`
  - `.qa/issue138/manual_qa_20260309_101810_final/screenshots/04_recruiter_pre_cutoff_artifact.png`
  - `.qa/issue138/manual_qa_20260309_101810_final/screenshots/05_recruiter_post_cutoff_artifact_sha.png`

## Risks / Rollout Notes

- Backend remains source of truth for cutoff state and evaluation basis.
- UI copy intentionally avoids overclaiming anti-cheat guarantees.
- Cutoff commit links are rendered only when repo URL is a valid GitHub URL.

## Dependencies

- Depends on `#136`.
- Backend cutoff contract dependency is satisfied by the paired `tenon-backend` patch that now exposes `cutoffCommitSha` and `cutoffAt` on candidate runtime endpoints.
