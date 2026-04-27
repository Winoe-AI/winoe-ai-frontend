# PR: Complete Day 1 design document workspace

## Linked Issue

- Winoe-AI/winoe-ai-frontend issue #182

## Summary

This PR implements the Day 1 candidate design document workspace for the v4 from-scratch Tech Trial model. Day 1 is now Project Brief-first: candidates plan from scratch, choose their tech stack, make architecture and dependency decisions, define project organization, set a testing strategy, document risks and tradeoffs, and outline their Days 2-3 implementation plan.

The stale GitHub issue criterion for a read-only repository exploration link is intentionally not implemented because it was superseded by the v4 pivot. There is no pre-populated codebase to explore on Day 1.

## Implementation Summary

- Added a Day 1-specific design document workspace.
- Displayed Project Brief / prestart context prominently above the editor.
- Added from-scratch design guidance and starter content covering tech stack, architecture, project structure, testing strategy, risks, tradeoffs, and Days 2-3 plan.
- Added side-by-side markdown editor and live preview.
- Added responsive layout behavior for narrower screens.
- Added autosave states: `Saving...`, `Saved`, and `Save failed`.
- Added submit confirmation dialog before final Day 1 submission.
- Added deadline card / countdown using existing `task.cutoffAt`.
- Added deadline-triggered autosave.
- Added immutable closed/submitted Day 1 view.
- Preserved saved draft artifact restoration after cutoff when no finalized submission exists.
- Prevented starter content from being written before restore settles.
- Kept finalized submitted content authoritative over draft restore.
- Hardened submit confirmation against disabled/pending duplicate submission states.

## Files Changed

- `src/features/candidate/tasks/CandidateTaskViewInner.tsx`
- `src/features/candidate/tasks/components/Day1DesignDocWorkspace.tsx`
- `src/features/candidate/tasks/components/Day1DeadlineCard.tsx`
- `src/features/candidate/tasks/components/TaskActions.tsx`
- `src/features/candidate/tasks/components/TaskWorkArea.tsx`
- `src/features/candidate/tasks/components/DraftSaveStatus.tsx`
- `src/features/candidate/tasks/hooks/useTaskSubmitController.ts`
- `src/features/candidate/tasks/hooks/useTaskSubmitController.types.ts`
- `src/features/candidate/tasks/hooks/useTaskDraftAutosave.ts`
- `src/features/candidate/tasks/hooks/useTaskDraftAutosave.types.ts`
- `src/features/candidate/tasks/utils/day1DesignDocUtils.ts`
- Focused Day 1/task autosave/submit tests

## QA Evidence

### Manual QA

- QA PASSED - ready for pr.md update
- Frontend URL used: `http://localhost:3000`
- Backend URL used: `http://localhost:8000`
- Candidate QA account used: candidate account only; credentials are not included here.
- Controlled Day 1 fixture:
  - token `qa-day1`
  - candidateSessionId `77`
  - taskId `1`
- `FRONTEND_QA_PLAYBOOK.md` was not present, so QA followed repo README/run scripts and documented QA fixtures.

### Manual QA Scenarios Passed

- Candidate login and active Day 1 workspace
- Project Brief displayed prominently above editor
- No repository exploration link/copy
- From-scratch design prompts present
- Markdown editor and live preview work
- Responsive layout checked
- Autosave success checked
- Autosave failure forced via mocked `PUT /api/backend/tasks/1/draft` returning 500
- Submit confirmation cancel/confirm checked
- Submitted Day 1 locks read-only
- Deadline countdown checked
- Deadline reached while page open checked
- Reload after cutoff with saved draft checked
- Reload after cutoff with finalized submission checked
- Reload after cutoff with no saved content checked
- Forbidden-term scan passed

### QA Artifacts

The issue #182 manual QA artifact directory is tracked in this repo. The latest contract-live Playwright result path is ignored by `.gitignore`, so it is referenced as local evidence and should not be added unless repo convention changes.

- `qa_verifications/issue182-day1-manual-qa/2026-04-27T20-00-18-214Z/`
- `qa_verifications/issue182-day1-manual-qa/2026-04-27T20-00-18-214Z/manual-qa-results.json`
- `qa_verifications/Contract-Live-QA/contract_live_qa_latest/artifacts/2026-04-27T19-55-37-266Z/playwright/results.json`

## Automated Checks

- PASS `npm run typecheck`
- PASS `npm run lint`
- PASS `npm test -- --runInBand` - 499 suites / 1550 tests
- PASS `npm test -- --runInBand tests/unit/features/candidate/tasks/CandidateTaskView.day1DesignDoc.test.tsx` - 13 tests
- PASS `npm test -- --runInBand tests/unit/features/candidate/tasks/components/TaskActions.test.tsx` - 3 tests
- PASS `npm test -- --runInBand tests/unit/features/candidate/tasks/hooks/useTaskDraftAutosave.test.tsx` - 4 tests
- PASS `npm test -- --runInBand tests/unit/features/candidate/tasks/hooks/useTaskDraftAutosave.extra.test.tsx` - 4 tests

### Forbidden-Term Scan

```bash
rg -n "Tenon|SimuHire|recruiter|simulation|Fit Profile|Fit Score|template|precommit|Specializor|existing codebase|starter code|read-only repository|offline|local work" src/features/candidate/tasks tests/unit/components/candidate tests/unit/features/candidate/tasks
```

Result: PASS, no matches.

## Risks / Assumptions

- Deadline behavior depends on backend providing accurate `task.cutoffAt`.
- `FRONTEND_QA_PLAYBOOK.md` was not present locally; QA used repo README/run scripts.
- Cutoff edge cases were verified with controlled Playwright fixtures.
- Downstream Talent Partner review surfaces, Evidence Trail entries, Winoe Report content, and Winoe Score calculations depend on existing backend/reporting flows consuming the finalized Day 1 artifact correctly.
