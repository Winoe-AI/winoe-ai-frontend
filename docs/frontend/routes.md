# Routes and Structure

Route truth source: `src/app/**` and request interception in `src/proxy.ts` + `src/platform/middleware/**`.

## App Router

### Marketing and Auth

- `/`
- `/auth/login`
- `/auth/logout`
- `/auth/error`
- `/auth/clear` (route handler)
- `/not-authorized`

### Candidate

- `/candidate/dashboard`
- `/candidate/session/[token]`
- `/candidate/what-we-evaluate`
- `/candidate-sessions/[token]` (legacy route that redirects to `/candidate/session/[token]`)

### Talent Partner

- `/dashboard`
- `/dashboard/trials/new`
- `/dashboard/trials/[id]`
- `/dashboard/trials/[id]/candidates/[candidateSessionId]`
- `/dashboard/trials/[id]/candidates/[candidateSessionId]/winoe-report`

## API Routes (`src/app/api`)

### Proxy and Health

- `/api/backend/[...path]` (authenticated backend proxy; forwards to backend `/api/{path}`)
- `/api/health` (proxies backend `/health`)

### Auth and Diagnostics

- `/api/auth/me`
- `/api/auth/access-token` (local-only endpoint, currently returns `410` when enabled locally)
- `/api/dev/access-token` (local-only endpoint, currently returns `410` when enabled locally)
- `/api/debug/auth` (non-production debug route)

### Talent Partner BFF

- `/api/dashboard`
- `/api/trials`
- `/api/trials/[id]`
- `/api/trials/[id]/invite`
- `/api/trials/[id]/terminate`
- `/api/trials/[id]/candidates`
- `/api/trials/[id]/candidates/compare`
- `/api/trials/[id]/candidates/[candidateSessionId]/invite/resend`
- `/api/submissions`
- `/api/submissions/[submissionId]`
- `/api/candidate_sessions/[candidateSessionId]/winoe_report`
- `/api/candidate_sessions/[candidateSessionId]/winoe_report/generate`

## Middleware Boundary

- Proxy entrypoint: `src/proxy.ts`.
- Main implementation: `src/platform/middleware/proxy.ts`.
- Route role gating:
  - Candidate area: `/candidate*`, `/candidate-sessions*`.
  - Talent Partner area: `/dashboard*`.
- Public routes include `/`, `/auth/*`, `/not-authorized`, and API pass-through handling.

## Key Source Directories

- `src/app`: routes/layouts/loading/error/API handlers.
- `src/features`: page/feature modules by domain.
- `src/platform`: API client, auth, middleware, proxy/BFF infrastructure.
- `src/shared`: shared UI, hooks, query/notifications providers.
