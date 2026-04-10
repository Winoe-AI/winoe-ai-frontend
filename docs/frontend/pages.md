# Pages Catalog

Major route behavior summary from `src/app/**` and feature modules.

## `/`

- Route params: none.
- Rendered components: `MarketingHomePage` via `src/app/(marketing)/page.tsx`.
- Load-time API calls: none directly from page; reads cached Auth0 session (`getCachedSessionNormalized`).
- Key interactions: marketing CTA/navigation.
- State:
  - Local: component-local UI state inside marketing feature modules.
  - Global: Auth/session context via middleware + root providers.
- Success/error behavior: static render; global error boundary handles unexpected errors.

## `/auth/login`

- Route params: query `mode`, `returnTo`.
- Rendered components: `LoginPage`.
- Load-time API calls: none on route load.
- Key interactions: redirects to Auth0 login flow with candidate/talent_partner mode.
- State:
  - Local: `LoginPage` view logic.
  - Global: middleware auth/session.
- Success/error behavior: successful auth redirects via Auth0 callback; missing config shows dev warning copy.

## `/auth/error`

- Route params: query `returnTo`, `mode`, `error`, `errorCode`, `errorId`, `cleared`.
- Rendered components: `AuthErrorPage`.
- Load-time API calls: none.
- Key interactions: retry navigation back to login/return path.
- State: local query-derived state only.
- Success/error behavior: deterministic error view rendering from query params.

## `/auth/logout`

- Route params: none.
- Rendered components: `LogoutPage`.
- Load-time API calls: none.
- Key interactions: submit logout action through `LogoutLink` (`/auth/logout` flow), or cancel back to dashboard.
- State: local-only UI state.
- Success/error behavior: user is logged out and redirected by Auth0 middleware path handling.

## `/auth/clear` (route handler)

- Route params: query `returnTo`, `mode`.
- Rendered components: none (HTTP redirect handler).
- Load-time API calls: none.
- Key interactions: clears auth cookies (`isAuthCookie`) then redirects to `/auth/error?cleared=1`.
- State: none persisted in React state; request/response cookie mutation only.
- Success/error behavior: deterministic redirect to auth-error state with cleared-session marker.

## `/not-authorized`

- Route params: query `mode`, `returnTo`.
- Rendered components: in-route JSX with navigation links.
- Load-time API calls: none.
- Key interactions: navigate to candidate dashboard or talent partner dashboard.
- State: local query-derived routing state.
- Success/error behavior: static guarded destination links.

## `/candidate/dashboard`

- Route params: none.
- Rendered components: `CandidateDashboardPage`, `DashboardHeader`, `InviteList`.
- Load-time API calls:
  - `GET /candidate/invites` (via `listCandidateInvites`).
  - Prefetch path may call:
    - `GET /candidate/session/{token}`
    - `GET /candidate/session/{candidateSessionId}/current_task`
- Key interactions: continue invite, prefetch on intent, refresh invites.
- State:
  - Local: dashboard error/loading state and action state.
  - Global: candidate session context (`CandidateSessionProvider`) + React Query cache.
- Success/error behavior: successful invite list and navigation; auth failures redirect to candidate login; invite errors surfaced inline.

## `/candidate/session/[token]`

- Route params: `token`.
- Rendered components: `CandidateSessionPage` -> `CandidateSessionView` with subviews (`LoadingView`, `SchedulingView`, `LockedView`, `RunningView`, `ErrorView`, `CompleteView`).
- Load-time API calls:
  - `GET /candidate/session/{token}`
  - `POST /candidate/session/{token}/schedule` (when schedule required)
  - `GET /candidate/session/{candidateSessionId}/current_task`
- Key interactions:
  - task submission: `POST /tasks/{taskId}/submit`
  - coding flow: `GET/POST /tasks/{taskId}/codespace/*`, `POST /tasks/{taskId}/run`, `GET /tasks/{taskId}/run/{runId}`
  - drafts: `GET/PUT /tasks/{taskId}/draft`
  - handoff: `GET /tasks/{taskId}/handoff/status`, `POST /tasks/{taskId}/handoff/upload/init`, signed upload URL, `POST /tasks/{taskId}/handoff/upload/complete`, `POST /recordings/{recordingId}/delete`
- State:
  - Local: controller state for view mode, errors, scheduling draft, task state, handoff/reflection form state.
  - Global: candidate session provider state + React Query + notifications.
- Success/error behavior: transitions between scheduling/locked/running/completed; handles invite expiry/auth errors/window-closed and API failures with contextual copy.

## `/candidate/what-we-evaluate`

- Route params: none.
- Rendered components: static informative page section content.
- Load-time API calls: none.
- Key interactions: informational only.
- State: static.
- Success/error behavior: static render.

## `/candidate-sessions/[token]` (legacy)

- Route params: `token`.
- Rendered components: none (server redirect route).
- Load-time API calls: none.
- Key interactions: redirects to `/candidate/session/[token]`.
- State: none.
- Success/error behavior: `notFound()` on missing token.

## `/dashboard`

- Route params: none.
- Rendered components: `Talent PartnerDashboardPage` -> `Talent PartnerDashboardView`.
- Load-time API calls:
  - `GET /api/dashboard` (BFF route)
  - BFF fan-out upstream:
    - backend `GET /api/auth/me`
    - backend `GET /api/trials`
- Key interactions: refresh dashboard data; open invite modal from trial list.
- State:
  - Local: dashboard loading/error and modal flow state.
  - Global: React Query cache + notifications.
- Success/error behavior: partial-error tolerant payload (`profileError`, `trialsError`) with graceful UI fallbacks.

## `/dashboard/trials/new`

- Route params: none.
- Rendered components: `TrialCreatePage`, `TrialCreateForm`.
- Load-time API calls: none required for initial render.
- Key interactions: submit create form -> `POST /api/trials`.
- State:
  - Local: form values/validation/submission state.
  - Global: navigation and notification side effects.
- Success/error behavior: success navigates to new trial detail; backend validation/errors are surfaced on form.

## `/dashboard/trials/[id]`

- Route params: `id` (trial id).
- Rendered components: `TrialDetailContainer` -> `TrialDetailView` and section components.
- Load-time API calls:
  - `GET /api/trials/{id}`
  - `GET /api/trials/{id}/candidates`
  - `GET /api/trials/{id}/candidates/compare`
- Key interactions:
  - invite candidate: `POST /api/trials/{id}/invite`
  - resend invite: `POST /api/trials/{id}/candidates/{candidateSessionId}/invite/resend`
  - terminate: `POST /api/trials/{id}/terminate`
  - scenario lifecycle (current implementation): `/api/backend/trials/...` + `/api/backend/jobs/{jobId}`
- State:
  - Local: scenario editor state, invite modal, candidate row action state, terminate modal state.
  - Global: React Query caches for detail/candidates/compare and notifications.
- Success/error behavior: blocked states for 403/404, generation polling, row-level resend errors, and scenario action error banners.

## `/dashboard/trials/[id]/candidates/[candidateSessionId]`

- Route params: `id`, `candidateSessionId`.
- Rendered components: `CandidateSubmissionsPage` -> `CandidateSubmissionsView` and artifact cards.
- Load-time API calls:
  - `GET /api/submissions?candidateSessionId=...&trialId=...`
  - `GET /api/submissions/{submissionId}` (for selected/latest artifacts)
  - `GET /api/trials/{id}/candidates` (candidate verification)
- Key interactions: reload, pagination/show-all toggle, artifact fetch refresh.
- State:
  - Local: submissions loader state, artifact cache state, pagination state.
  - Global: React Query cache + notifications.
- Success/error behavior: explicit candidate-id validation, candidate verification failures, artifact warning banner when partial artifact fetch fails.

## `/dashboard/trials/[id]/candidates/[candidateSessionId]/winoe-report`

- Route params: `id`, `candidateSessionId`.
- Rendered components: `WinoeReportPage`, status/ready sections and toolbar.
- Load-time API calls:
  - `GET /api/candidate_sessions/{candidateSessionId}/winoe_report` (polls when running)
- Key interactions:
  - generate report: `POST /api/candidate_sessions/{candidateSessionId}/winoe_report/generate`
  - reload status.
- State:
  - Local: winoe-report derived state (`not_generated`, `running`, `ready`, error states), generate pending state.
  - Global: React Query winoe-report status cache.
- Success/error behavior: ready report view when available; running poll state; error/status panels for forbidden/missing/not-generated cases.
