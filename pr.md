# 1. Title

Fix Day 2 candidate UI: GitHub username capture, pending-state reliability, and Codespace-only copy for issue #183

# 2. Linked Issue

- Winoe-AI/winoe-ai-frontend issue #183
- Depends on backend issues #285 and #286

# 3. Problem / Why

Day 2 candidate flow had multiple user-facing failures that prevented a real candidate from moving through the workspace lifecycle cleanly:

- GitHub username was not reliably captured and sent into the Codespace init contract.
- Run tests and submit flows could hang in pending states instead of resolving to success or failure.
- Frontend polling could drift from the backend-provided `pollAfterMs` guidance.
- Day 2 and Day 3 copy still implied offline/local work paths instead of Codespace-only work.
- The workspace CTA and status messaging were not strong enough for the actual Codespace-first flow.
- Day-window behavior needed to be explicit: open from 9 AM to 5 PM local time, then switch to read-only with a closed message after cutoff.
- Reload and restart recovery needed to use durable product state instead of a volatile client-only "started" state.

# 4. What Changed

- Day 2 workspace init now uses the captured GitHub username correctly.
- The candidate flow now validates GitHub username before opening Day 2.
- Codespace init and task bootstrap follow the backend contract expected by #285.
- Day 2 and Day 3 copy is Codespace-only throughout the candidate UI.
- The Codespace URL is shown prominently and is accessible from the workspace view.
- Run tests lifecycle now resolves correctly through idle, running, success, and failure instead of getting stuck at Starting.
- Submit and Continue now resolves correctly instead of getting stuck at Submitting.
- Frontend polling now honors the backend `pollAfterMs` value from the response utils.
- Day 2 open-window behavior is explicit, with local-time countdown support for the 9 AM to 5 PM window.
- After cutoff, the UI switches to read-only state and shows the Day closed message.
- Restart and reload recovery now come from durable product state rather than a client-only started flag.

# 5. Key Files Changed

- `src/features/candidate/session/api/workspaceApi.ts`
- `src/features/candidate/tasks/hooks/useRunTests.ts`
- `src/features/candidate/tasks/hooks/useRunTestsScheduler.ts`
- `src/features/candidate/tasks/` Day 2 candidate components

# 6. QA Summary

Final verification was completed on the real local stack with:

- real frontend + backend services
- real browser auth
- no QA-driver state seeding
- live Day 2 open proof
- live after-cutoff read-only proof
- live Codespace init, run tests, and submit flow verification

Behavior verified end to end:

- GitHub username capture/validation before Day 2 opens
- `githubUsername` included in the Codespace init request
- run tests lifecycle reaches terminal success/failure states
- submit and continue completes reliably
- polling follows backend `pollAfterMs`
- Codespace-only copy is used throughout
- Codespace URL is surfaced prominently
- Day 2 is open only during 9 AM to 5 PM local time
- after cutoff the workspace is read-only with a closed message

# 7. Exact Live Evidence / Artifact Paths

- Open-day screenshot:
  - `/Users/robelmelaku/Desktop/Winoe-AI/winoe-frontend/qa_verifications/Contract-Live-QA/contract_live_qa_latest/artifacts/20260425T213610/candidate-day2-open.png`
- Closed-day screenshot:
  - `/Users/robelmelaku/Desktop/Winoe-AI/winoe-frontend/qa_verifications/Contract-Live-QA/contract_live_qa_latest/artifacts/20260425T213909/candidate-day2-closed.png`
- Schedule response:
  - `/Users/robelmelaku/Desktop/Winoe-AI/winoe-frontend/qa_verifications/Contract-Live-QA/contract_live_qa_latest/artifacts/20260425T212929/api/candidate-schedule-response.json`
- Workspace:
  - `/Users/robelmelaku/Desktop/Winoe-AI/winoe-frontend/qa_verifications/Contract-Live-QA/contract_live_qa_latest/artifacts/20260425T213610/api/candidate-day2-workspace.json`
- Run start:
  - `/Users/robelmelaku/Desktop/Winoe-AI/winoe-frontend/qa_verifications/Contract-Live-QA/contract_live_qa_latest/artifacts/20260425T213610/api/candidate-day2-run-start.json`
- Run poll:
  - `/Users/robelmelaku/Desktop/Winoe-AI/winoe-frontend/qa_verifications/Contract-Live-QA/contract_live_qa_latest/artifacts/20260425T213610/api/candidate-day2-run-tests-poll.json`
- Terminal run result:
  - `/Users/robelmelaku/Desktop/Winoe-AI/winoe-frontend/qa_verifications/Contract-Live-QA/contract_live_qa_latest/artifacts/20260425T213610/api/candidate-day2-run-result.json`
- Submit:
  - `/Users/robelmelaku/Desktop/Winoe-AI/winoe-frontend/qa_verifications/Contract-Live-QA/contract_live_qa_latest/artifacts/20260425T213610/api/candidate-day2-submit.json`
- Current task after submit:
  - `/Users/robelmelaku/Desktop/Winoe-AI/winoe-frontend/qa_verifications/Contract-Live-QA/contract_live_qa_latest/artifacts/20260425T213610/api/candidate-day2-current-task-after.json`
- Final contract-live report:
  - `/Users/robelmelaku/Desktop/Winoe-AI/winoe-frontend/qa_verifications/Contract-Live-QA/contract_live_qa_latest/contract_live_qa_report.md`

# 8. Zero-Seeding Verification

- No browser state was injected by the QA driver.
- No `sessionStorage` / `localStorage` / bootstrap / task-state restoration hacks were used.
- Real frontend + backend stack was used.
- Real browser auth was used.
- No mocked API routes were used.

# 9. Acceptance Criteria Checklist

- [x] GitHub username capture/validation step before Day 2 opens
- [x] Frontend sends `githubUsername` in Codespace init request
- [x] Run tests shows correct lifecycle: idle, running, success/failure
- [x] Submit and Continue completes reliably
- [x] Frontend polling honors backend `pollAfterMs`
- [x] All copy states are Codespace-only
- [x] Codespace URL is prominently displayed
- [x] Day 2 window is 9 AM - 5 PM local with countdown timer
- [x] After cutoff, the UI becomes read-only with a Day closed message

# 10. Risks / Follow-Ups

- The frontend is now aligned with the verified backend contract, but this flow still depends on backend issues #285 and #286 remaining in place.
- If the Codespace init payload changes again, the username capture step and polling contract should be re-validated against the live backend response.
- Any future Day 2/3 wording changes should keep the Codespace-only framing consistent across the session shell, workspace CTA, and task instructions.

# 11. Reviewer Notes

- This PR closes the frontend side of issue #183 on the real stack.
- Backend blockers #285 and #286 were required to make the flow verifiable end to end.
- The live QA evidence includes both the open-day and closed-day states, plus the run-tests and submit lifecycle artifacts.
- The UI now recovers from reload/restart using durable product state rather than a volatile client-only started state.

Worker Report:

- Summary
  - Updated `pr.md` only to describe the verified Day 2 candidate UI fix for issue #183.
- Files changed
  - `pr.md`
- Commands run
  - `sed -n '1,240p' pr.md` - pass
  - `rg -n "workspace|run-tests|submit|pollAfterMs|githubUsername|Day 2|closed|read-only|queued|jobs: \[\]" ...` - pass
- Risks / assumptions
  - Assumed the live QA artifacts are the source of truth for the final PR narrative.
  - Kept the frontend PR scoped to issue #183 and referenced backend blockers #285 and #286 without claiming backend alone closes the issue.
- Open questions / blockers
  - None
