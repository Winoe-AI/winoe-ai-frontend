# User Flows

## Candidate Flow (Current Implementation)

1. Candidate opens `/candidate/session/[token]`.

- Middleware enforces authenticated candidate access.
- Bootstrap resolves invite via `GET /candidate/session/{token}`.
- If schedule is missing, view moves to scheduling.
- If schedule exists but window is not open, view moves to locked state.

2. Candidate schedules session when required.

- API: `POST /candidate/session/{token}/schedule`.
- Success stores schedule/day windows in candidate session state.
- Validation errors (422), auth errors, and expired invites are surfaced in scheduling UI.

3. Candidate works current task.

- Current task API: `GET /candidate/session/{candidateSessionId}/current_task`.
- Submission API: `POST /tasks/{taskId}/submit`.
- Refresh path reloads current task after submit.

4. Coding task workflow (Day 2/3 style tasks).

- Workspace status: `GET /tasks/{taskId}/codespace/status`.
- Workspace init fallback: `POST /tasks/{taskId}/codespace/init`.
- Run tests: `POST /tasks/{taskId}/run` then poll `GET /tasks/{taskId}/run/{runId}`.

5. Draft autosave behavior.

- Load draft: `GET /tasks/{taskId}/draft`.
- Save draft: `PUT /tasks/{taskId}/draft`.
- Used by text/reflection task autosave hooks.

6. Day 4 handoff upload workflow.

- Status refresh: `GET /tasks/{taskId}/handoff/status`.
- Upload init: `POST /tasks/{taskId}/handoff/upload/init`.
- Browser direct upload: signed URL upload via XHR (external storage URL, not backend app route).
- Upload complete: `POST /tasks/{taskId}/handoff/upload/complete`.
- Delete recording: `POST /recordings/{recordingId}/delete`.

7. Day 5 reflection workflow.

- Uses structured reflection form UI (`Day5ReflectionPanel` and related hooks/components).
- Persists through standard task submit + draft endpoints.

## Talent Partner Flow (Current Implementation)

1. Talent Partner opens `/dashboard`.

- API: `GET /api/dashboard`.
- Server-side dashboard handler fans out to backend `/api/auth/me` and `/api/trials`.

2. Talent Partner creates trial (`/dashboard/trials/new`).

- API: `POST /api/trials`.

3. Talent Partner opens trial detail (`/dashboard/trials/[id]`).

- APIs:
  - `GET /api/trials/{id}`
  - `GET /api/trials/{id}/candidates`
  - `GET /api/trials/{id}/candidates/compare`
  - `POST /api/trials/{id}/invite`
  - `POST /api/trials/{id}/candidates/{candidateSessionId}/invite/resend`
  - `POST /api/trials/{id}/terminate`

4. Talent Partner submission review (`/dashboard/trials/[id]/candidates/[candidateSessionId]`).

- APIs:
  - `GET /api/submissions?candidateSessionId=...`
  - `GET /api/submissions/{submissionId}`
  - candidate verification via candidates list endpoint

5. Talent Partner winoe report (`/dashboard/trials/[id]/candidates/[candidateSessionId]/winoe-report`).

- APIs:
  - `GET /api/candidate_sessions/{candidateSessionId}/winoe_report`
  - `POST /api/candidate_sessions/{candidateSessionId}/winoe_report/generate`

## Flow Notes

- `/api/auth/access-token` and `/api/dev/access-token` exist but are currently disabled (`410`) in local-enabled mode and unavailable outside local.
- Scenario lifecycle actions (`activate`, `scenario regenerate/approve/patch`, `jobs poll`) currently call `/api/backend/*` paths from talent_partner client code. Backend-equivalent routes exist under `/api/*`; see mismatch matrix in `docs/frontend/api-integration.md`.
