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

### Recruiter

- `/dashboard`
- `/dashboard/simulations/new`
- `/dashboard/simulations/[id]`
- `/dashboard/simulations/[id]/candidates/[candidateSessionId]`
- `/dashboard/simulations/[id]/candidates/[candidateSessionId]/fit-profile`

## API Routes (`src/app/api`)

### Proxy and Health

- `/api/backend/[...path]` (authenticated backend proxy; forwards to backend `/api/{path}`)
- `/api/health` (proxies backend `/health`)

### Auth and Diagnostics

- `/api/auth/me`
- `/api/auth/access-token` (local-only endpoint, currently returns `410` when enabled locally)
- `/api/dev/access-token` (local-only endpoint, currently returns `410` when enabled locally)
- `/api/debug/auth` (non-production debug route)

### Recruiter BFF

- `/api/dashboard`
- `/api/simulations`
- `/api/simulations/[id]`
- `/api/simulations/[id]/invite`
- `/api/simulations/[id]/terminate`
- `/api/simulations/[id]/candidates`
- `/api/simulations/[id]/candidates/compare`
- `/api/simulations/[id]/candidates/[candidateSessionId]/invite/resend`
- `/api/submissions`
- `/api/submissions/[submissionId]`
- `/api/candidate_sessions/[candidateSessionId]/fit_profile`
- `/api/candidate_sessions/[candidateSessionId]/fit_profile/generate`

## Middleware Boundary

- Proxy entrypoint: `src/proxy.ts`.
- Main implementation: `src/platform/middleware/proxy.ts`.
- Route role gating:
  - Candidate area: `/candidate*`, `/candidate-sessions*`.
  - Recruiter area: `/dashboard*`.
- Public routes include `/`, `/auth/*`, `/not-authorized`, and API pass-through handling.

## Key Source Directories

- `src/app`: routes/layouts/loading/error/API handlers.
- `src/features`: page/feature modules by domain.
- `src/platform`: API client, auth, middleware, proxy/BFF infrastructure.
- `src/shared`: shared UI, hooks, query/notifications providers.
