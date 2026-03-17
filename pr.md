# Title

Issue #145: P2 compliance UX for candidate AI notice, consent-gated Day 4 finalize, and upload deletion handling

# TL;DR

Issue #145 is complete. Frontend compliance UX is delivered end-to-end, backend compatibility fallbacks are implemented, backend recruiter-submissions blocker is resolved, and final manual QA is PASS.

# Final Implementation State

## Frontend behavior delivered

- AI notice in scheduling flow.
- AI notice/reminder in Day 4 flow.
- Consent-gated finalize (`Complete upload` disabled until consent is checked).
- Delete upload CTA with irreversible confirmation modal.
- Transcript/deleted/unavailable state rendering in candidate Day 4 panel.
- Recruiter-side graceful handling for deleted/unavailable Day 4 media.

## Frontend contract fallback behavior

### Consent fallback chain

- `POST /tasks/{id}/handoff/consent`
- `POST /tasks/{id}/handoff/upload/consent`
- `POST /candidate/session/{candidateSessionId}/privacy/consent`
- Consent fields embedded in `upload/complete` payload when needed.

### Delete fallback chain

- `DELETE /tasks/{id}/handoff`
- `POST /tasks/{id}/handoff/delete`
- `POST /recordings/{recordingId}/delete`

## Frontend correctness improvements

- Fixed stale `refreshStatus` race by ignoring out-of-order responses via request-id tracking.
- Added deleted-state inference from `recording.status` (`deleted`/`purged`) when explicit deleted flags are absent.
- Day 4 panel delete action now explicitly includes `recordingId` for canonical delete endpoint compatibility.

## Backend blocker resolution

- `tenon-backend` recruiter submissions projection now includes:
  - `workflow_run_status`
  - `workflow_run_conclusion`
- Regression coverage was added to prevent recurrence of `/api/submissions` `MissingGreenlet` failure.

# Testing / QA

## Frontend checks

- PASS: targeted frontend tests
  - `npm test -- --runInBand tests/unit/features/candidate/session/task/handoff/HandoffUploadPanel.test.tsx tests/unit/features/candidate/session/task/handoff/handoffUploadMachine.test.ts tests/unit/features/candidate/session/task/handoff/handoffApi.test.ts tests/unit/features/recruiter/candidate-submissions/ArtifactDay4Handoff.test.tsx`
- PASS: `npm run lint`
- PASS: `npm run typecheck`
- PASS: `npm run build`

## Backend checks

- PASS: targeted backend integration tests
  - `poetry run pytest --no-cov tests/integration/api/test_submissions_api.py tests/integration/api/test_media_privacy_api.py`
- PASS: touched-file lint
  - `poetry run ruff check app/services/submissions/service_recruiter/list_submissions.py tests/integration/api/test_submissions_api.py`
- PASS: recruiter submissions regression coverage verified in integration suite (`test_submissions_api.py`) for `/api/submissions` stability.

## Final manual QA evidence

- Evidence bundle: `.qa/issue145/manual_qa_20260316_184739/QA_REPORT.md`
- Final QA verdict: PASS
- Scheduling AI notice verified.
- Day 4 AI notice verified.
- Consent gating verified.
- Finalize after consent verified.
- Transcript/media states verified.
- Delete flow verified.
- Recruiter submissions surface verified.
- Recruiter Day 4 unavailable/deleted behavior verified.
- `/api/submissions?...` verified at `200`.
- Canonical consent/delete endpoints verified at `200`.
- Legacy task-scoped consent/delete endpoints verified at `404`.

# Environment note

- Local workstation Postgres runtime was schema-drifted.
- Final live verification used playbook-approved sqlite fallback (`USE_SQLITE=1`).
- This did not block validation of issue #145 behavior on the real frontend + backend code.

Ready for PR raise: Yes
