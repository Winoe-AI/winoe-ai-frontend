# Configuration

Configuration truth source:

- `next.config.ts`
- `next.config.csp.ts`
- `src/platform/**`
- route handlers in `src/app/api/**`

## Runtime Configuration

- Backend upstream base URL comes from `TENON_BACKEND_BASE_URL` (`src/platform/server/bff/upstream.ts`).
- Candidate API base defaults to `NEXT_PUBLIC_TENON_API_BASE_URL` (`src/platform/api-client/client/bffFetch.constants.ts`, default `/api/backend`).
- Recruiter BFF client defaults to base path `/api` (`src/platform/api-client/client/clients.ts`).
- Middleware and BFF auth enforcement are controlled by Auth0 session/token availability and permission checks in:
  - `src/platform/middleware/proxy.ts`
  - `src/platform/server/bffAuth.ts`

## Security and Proxy Controls

- Request-size and response-size limits for backend proxy:
  - `TENON_PROXY_MAX_BODY_BYTES`
  - `TENON_PROXY_MAX_RESPONSE_BYTES`
- Proxy method restrictions and mutation guards are defined in:
  - `src/platform/server/backendProxy/requestSecurity.constants.ts`
  - `src/platform/server/backendProxy/requestSecurity.methodPolicy.ts`
  - `src/platform/server/backendProxy/requestSecurity.sameOrigin.ts`

## Auth0 Configuration

Server env requirements checked in `src/platform/auth0/helpers/env.ts`:

- `TENON_AUTH0_SECRET`
- `TENON_AUTH0_DOMAIN`
- `TENON_AUTH0_CLIENT_ID`
- `TENON_AUTH0_CLIENT_SECRET`
- `TENON_APP_BASE_URL`

Client auth routing helpers additionally use:

- `NEXT_PUBLIC_TENON_AUTH0_CANDIDATE_CONNECTION`
- `NEXT_PUBLIC_TENON_AUTH0_RECRUITER_CONNECTION`
- `NEXT_PUBLIC_TENON_AUTH0_CLAIM_NAMESPACE`
- `NEXT_PUBLIC_TENON_APP_BASE_URL` / `NEXT_PUBLIC_VERCEL_URL`

## Build Flags

- `ANALYZE`: toggles bundle analysis branch in `next.config.ts`.
- `TENON_DEPLOY_ENV` and `VERCEL_ENV`: influence production-security header behavior in `next.config.ts`.
- CSP extensions use:
  - `NEXT_PUBLIC_TENON_API_BASE_URL`
  - `TENON_AUTH0_DOMAIN`
  - `NEXT_PUBLIC_TENON_MEDIA_ALLOWED_ORIGINS`

## Full Env Variable List

The complete repository env variable table (runtime + test + scripts) is maintained in root `README.md` under **Environment Variables (Complete)**.
