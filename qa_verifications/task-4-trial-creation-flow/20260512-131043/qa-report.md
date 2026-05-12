# Task 4 — Real local QA (Trial creation v4)

## Environment

- **Frontend:** `http://localhost:3000` (`./runFrontend.sh`, Next dev)
- **Backend:** `http://localhost:8000` (`./runBackend.sh` supervised API + worker)
- **Talent Partner session:** `/api/dev/qa-login` (local-only), `role=talent_partner`, `returnTo=/dashboard`
- **Scenario generation runtime:** For reproducible end-to-end completion, the backend was restarted with `WINOE_SCENARIO_GENERATION_RUNTIME_MODE=demo`. With `real` mode (default from `runBackend.sh`), worker logs showed repeated `scenario_generation_llm_failed` / `scenario_generation_job_failed` for this workspace, so the Trial never reached `complete` over SSE and the UI would not redirect to preview within a practical timeout. Demo mode is the supported local/test path per `/ready` (`scenarioGeneration` reports `demo_mode`).

## Health checks

- `GET http://localhost:8000/ready` — **200**, JSON saved to `artifacts/backend-ready.json`
- `GET http://localhost:3000/api/health` — **200** `{"status":"ok"}`, saved to `artifacts/frontend-health.json`

## Entry points (browser)

| Entry                               | Result                                                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard header **New Trial**      | Pass — navigates to `/talent-partner/trials/new` (see `screenshots/01b-dashboard-header-new-trial.png`)                               |
| Direct `/talent-partner/trials/new` | Pass                                                                                                                                  |
| Legacy `/dashboard/trials/new`      | Pass — same wizard (see `screenshots/03-legacy-dashboard-trials-new.png`)                                                             |
| Command palette “New Trial”         | Not automated here — palette quick action is labeled **Create new Trial** (manual: open palette, choose that item, expect same route) |
| Dashboard empty-state CTA           | Not exercised (seeded account had trials); no regression evidence                                                                     |

## Step 1 — Role & Language

- Title **New Trial**, back link to dashboard, 3-dot stepper, step label **Role & Language**
- Fields: Role title, Seniority, Preferred language/framework (optional) with helper about any stack
- Continue disabled with empty role title; enabled with role + seniority; optional LF filled — pass (`04-step1-filled.png`)

## Step 2 — Context

- Step label **Context**, required focus textarea, optional focus-area pills — pass (`05-step2-filled.png`)
- **Generate Trial preview** enabled with required copy + selected areas — pass

## Create request (v4)

- Intercepted POST body saved to `artifacts/create-trial-post-body.json`
- Contains `role_title`, `seniority`, `preferred_language_framework`, `focus_notes`, `evaluation_focus_areas`
- Does **not** contain `template_key`, `template_repository`, `template_repo`, `tech_stack`, `techStack`
- HTTP **202** on create (asserted via `waitForResponse`)

## Generation loading + SSE

- Heading **Drafting your Trial**, six steps, wheat icon — pass (`06-generation-loading-early.png`, `07-generation-loading-mid.png`)
- Browser uses `EventSource` on `/api/v1/trials/{trial_id}/generation-progress` (same-origin via Next); with demo worker, stream completes without CORS/auth errors
- Redirect to `/talent-partner/trials/{id}/preview` after completion — pass (`08-preview-after-redirect.png`)
- **25s patience line:** not forced in this run (generation finished before 25s)

## Failure path

- Second Playwright test aborts the generation-progress URL; UI shows **Reconnecting to Winoe…** / **We lost the connection** copy — pass (`09-failure-stream-abort.png`)

## Post-run identifiers

- **Trial ID (happy path):** see `artifacts/created-trial-id.txt`
- **Job ID:** not captured in artifacts (optional follow-up: log `POST` response JSON in the spec)

## Grep / static checks (2026-05-12)

- Frontend legacy identifiers (`templateCatalog`, `template_repository`, … in `src/**/*.ts(x)`) — **no matches**
- Frontend retired vocabulary grep — **no matches** in scope
- Backend `template_repository` / `tech_stack` / etc. — hits are **migrations, demo seed, workspace/template compatibility**, not the v4 create API surface (see supervisor grep log in session)

## Screenshots

All under `screenshots/` in this folder (see filenames above).
