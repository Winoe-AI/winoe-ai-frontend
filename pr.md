# Title

Issue #140: Day 4 handoff video upload + persisted preview + transcript UI

## TL;DR

- Added and wired `HandoffUploadPanel` for Day 4 handoff tasks, replacing the prior link-only Day 4 behavior.
- Implemented signed URL upload flow (`init` -> direct-to-storage upload -> `complete`) with immediate local preview.
- Added persisted preview hydration from backend `recording.downloadUrl` plus transcript processing/ready rendering (`progress`, `text`, `segments`).
- Preserved cutoff/window-closed behavior and retry safety (stale-attempt guard and object URL cleanup).

## Problem

Day 4 previously relied on prompt-linked resource URLs and did not provide an end-to-end upload flow, preview/resubmit UX, or transcript processing/ready UI.

## What changed

- Added `HandoffUploadPanel` in `src/features/candidate/session/task/handoff/*` and routed `task.type === "handoff"` through it in `CandidateTaskView`.
- Wired signed URL upload flow:
  - `POST /api/tasks/{task_id}/handoff/upload/init`
  - Direct file upload to object storage signed URL with progress
  - `POST /api/tasks/{task_id}/handoff/upload/complete`
- Hydrated persisted preview from backend status `recording.downloadUrl`, while keeping immediate local blob preview post-upload.
- Rendered transcript states end-to-end:
  - Processing state with progress badge
  - Ready state with full transcript text
  - Timestamped segment list in a scrollable container
  - Truthful fallback when status is ready but text/segments are empty
- Updated handoff state machine to track preview source (`local` vs `persisted`), transcript payload fields, and safe hydration transitions.
- Preserved robustness behavior:
  - Retry and refresh flows
  - Stale upload-attempt protection
  - Object URL revoke/cleanup on replace and unmount
  - Cutoff enforcement and `TASK_WINDOW_CLOSED` handling
  - Non-failing degradation when persisted preview URL is temporarily unavailable

## API / contract notes

Frontend now relies on the approved backend handoff-status patch that added:

- `recording.downloadUrl`
- `transcript.text`
- `transcript.segments`

Frontend consumes these candidate handoff status fields:

- `recording.downloadUrl`
- `transcript.status`
- `transcript.progress`
- `transcript.text`
- `transcript.segments`

## Testing / QA

Final strict manual/runtime QA for Issue #140: PASS.

- Runtime method used real localhost services and browser automation: frontend `http://127.0.0.1:3000`, backend `http://127.0.0.1:8000`, Playwright, and local MinIO (`127.0.0.1:9000`) for signed upload flow.
- Verified in strict runtime QA:
  - Day 4 handoff upload flow passes end-to-end with preview.
  - Persisted preview works after revisit/reload.
  - No-tamper progression holds: Day 4 remains current/actionable until Day 5 opens.
  - Resubmit works until cutoff; cutoff closure is enforced with clean `TASK_WINDOW_CLOSED` handling.
  - Signed URL console/UI leakage regression is not present in this QA evidence (leak checks PASS).
- Evidence source: `.qa/issue140/manual_qa_20260311_1717/QA_REPORT.md` and `.qa/issue140/manual_qa_20260311_1717/artifacts/qa_result_final.json` (with Day 4 no-tamper proof in `.qa/issue140/manual_qa_20260311_1717/artifacts/day4_no_tamper_current_task_proof.json`).
- Internal-only note: the raw QA evidence bundle is internal and should not be shared publicly as-is.

## Risks / follow-ups

- Persisted preview depends on short-lived signed URLs; frontend degrades gracefully and supports refresh/retry when a persisted URL is unavailable/expired.
- No extra blocker remains for Issue #140.

## Screenshots / demo notes

No new screenshots were captured in this run. UI evidence is covered by tests; screenshots can be attached at PR raise if needed.
