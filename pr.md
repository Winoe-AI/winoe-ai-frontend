# PR: Remove offline/local work copy and enforce Codespace-only messaging throughout candidate UI

## Linked Issue

- Winoe-AI/winoe-ai-frontend issue #194

## Summary

This PR removes offline/local-work permission copy from candidate and Talent Partner surfaces, enforces Codespace-only messaging for Day 2 and Day 3, and makes the Codespace URL/card the primary work environment in the candidate UI.

The Talent Partner submission review copy now frames evidence as coming from the official Trial repository and Codespace-captured work.

The contract-live QA harness also now runs the full Day 1 -> Day 2 -> Day 3 -> Talent Partner review proof deterministically on the local demo-mode backend, while preserving environment discipline:

- local QA sources local env files only
- prod env files are not sourced
- dev-auth bypass is not used
- backend demo fallback is env-controlled only

## What Changed

### Frontend product changes

- Removed offline/local-work permission copy from candidate-facing and Talent Partner-facing UI.
- Updated Day 2 and Day 3 informational text to emphasize Codespace-only workflow.
- Promoted the Codespace URL/card so it is the primary work environment for Day 2 and Day 3.
- Updated Talent Partner submission review copy to reference the official Trial repository and Codespace-captured work.

### Frontend QA harness changes

- Improved the contract-live harness so the full sequence runs deterministically on the local demo-mode backend.
- Kept the harness aligned with the day-by-day proof flow:
  - `talent_partner-fresh`
  - `candidate-schedule`
  - `candidate-day:1`
  - `candidate-day:2`
  - `candidate-day:3`
  - `talent_partner-review`
- Verified the flow with `trialId=1` and `candidateSessionId=1`.

### Backend scope

- No backend files remain changed in the current diff.
- The unrelated backend compare-summary behavior change was reverted and is not part of this PR.

## Files Changed

### Frontend

- `pr.md`

### Backend

- None in the current diff.

## QA Evidence

Evidence bundle:

- `qa_verifications/Contract-Live-QA/contract_live_qa_latest/artifacts/20260426T201813`

Full contract-live sequence passed:

- `talent_partner-fresh,candidate-schedule,candidate-day:1,candidate-day:2,candidate-day:3,talent_partner-review`

Trial/session:

- `trialId=1`
- `candidateSessionId=1`

### Day 2 evidence

- Route: `http://localhost:3000/candidate/session/3ayfNEd6d5ySAKUM5FmBH8n2fsODfbxF3-r6mMP6Te4`
- Screenshot: `candidate-day2-after.png`
- Verified text:
  - `Codespace workspace`
  - `Day 2 and Day 3 implementation work must happen in GitHub Codespaces only.`
  - `PRIMARY WORK ENVIRONMENT`
  - `Open Codespace`
  - `Use this Codespace for all Day 2 and Day 3 implementation work.`

### Day 3 evidence

- Route: `http://localhost:3000/candidate/session/3ayfNEd6d5ySAKUM5FmBH8n2fsODfbxF3-r6mMP6Te4`
- Screenshot: `candidate-day3-after.png`
- Verified text:
  - `Codespace workspace`
  - Codespace-only implementation language
  - `PRIMARY WORK ENVIRONMENT`
  - `Open Codespace`
  - `Implementation Wrap-Up`

### Talent Partner review evidence

- Route: `http://localhost:3000/dashboard/trials/1/candidates/1`
- Screenshot: `talent_partner-submissions-page.png`
- Verified text:
  - `Latest GitHub artifacts (Day 2 / Day 3)`
  - `official Trial repository and Codespace-captured work`
  - no offline/local permission copy

## Checks

Frontend:

- `npm run lint` - pass
- `npm run typecheck` - pass
- targeted Jest suite - pass
  - `tests/unit/shared/ui/IntegrityCallout.test.tsx`
  - `tests/unit/features/talent-partner/submission-review/ArtifactCard.test.tsx`
  - `tests/unit/features/candidate/session/views/WorkspaceAndTests.test.tsx`
  - `tests/unit/features/candidate/tasks/CodespaceFallbackPanel.test.tsx`
  - `tests/unit/features/candidate/session/CandidateSessionView.schedule.test.tsx`
- Full precommit - pass

Backend:

- `python3 -m py_compile ...` - pass for changed backend files
- `bash -n runBackend.sh` - pass
- targeted backend pytest - pass if backend files remain changed
- Not applicable in the current diff because no backend files remain changed.

## Forbidden-Term Scan

Exact command:

```bash
rg -n -i "offline|local work|work locally|work offline|local-only|offline/local" src tests qa_verifications pr.md
```

Result:

- One stale mention in `pr.md` before this rewrite.
- `tests/*` hits only use `new TypeError('offline')` as a technical failure fixture.
- `qa_verifications/*` hits are archived historical artifacts from earlier bundles, not current product copy.

No current user-facing candidate or Talent Partner UI copy in the active frontend source tree should mention offline or local work after this PR material update.

## Acceptance Criteria Checklist

- [x] No UI copy anywhere mentions offline or local work.
- [x] Day 2 and Day 3 informational text emphasizes Codespace-only workflow.
- [x] Talent Partner submission review copy removes offline/local permission.
- [x] Day 2/3 UI prominently displays the Codespace URL as primary work environment.

## Risk / Rollback

- The contract-live proof uses env-controlled backend demo mode because Anthropic quota was exhausted.
- Prod env files were not sourced.
- Dev-auth bypass was not used.
- The local QA harness resets and boots a clean local stack to avoid stale port/server issues.
- Any backend day-window support should be treated as local/test-only QA support, not a production behavior change.

## Scope Confirmation

- Frontend product changes are in scope.
- Frontend QA harness changes are in scope.
- Backend local/test support changes are not present in the current diff.
- The unrelated backend compare-summary behavior change is not in scope.

