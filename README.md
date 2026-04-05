# Tenon Frontend

Tenon Frontend is a Next.js App Router application for Tenon simulation workflows:

- Candidate portal: invite-based simulation access, scheduling, day-by-day task execution, coding run checks, handoff upload, and Day 5 reflection submission.
- Recruiter portal: simulation creation, candidate invites/resends, simulation detail + scenario controls, submission review, and fit-profile reporting.

## Product and Architecture Overview

- Framework: Next.js 16 (App Router) + React 19 + TypeScript.
- Routing: file-system routes in `src/app`.
- Middleware auth and role gating: `src/proxy.ts`, implementation in `src/platform/middleware`.
- Candidate API integration: client calls to `/api/backend/*` (proxied to backend `/api/*`).
- Recruiter API integration: BFF calls to `/api/*` routes in `src/app/api`.
- Core app layers:
  - `src/features`: product feature modules (candidate, recruiter, auth, marketing).
  - `src/platform`: API client, Auth0, middleware, proxy/BFF server utilities.
  - `src/shared`: shared UI, hooks, query/notification providers.

## Tech Stack

- `next@16`, `react@19`, `typescript@5`
- `@tanstack/react-query`
- `@auth0/nextjs-auth0`
- Jest + Testing Library for unit/integration tests
- Playwright for E2E tests
- ESLint + Prettier

## Prerequisites

- Node.js 20+
- npm 10+
- Running backend (`tenon-backend`) reachable from this repo
- Auth0 tenant/config values for authenticated flows

## Setup (Exact Local Flow)

1. Install dependencies:

```bash
npm install
```

2. Configure environment in `.env.local` (minimum local config shown, full table below):

```bash
TENON_BACKEND_BASE_URL=http://localhost:8000
NEXT_PUBLIC_TENON_API_BASE_URL=/api/backend

TENON_APP_BASE_URL=http://localhost:3000
TENON_AUTH0_SECRET=replace-me
TENON_AUTH0_DOMAIN=replace-me
TENON_AUTH0_CLIENT_ID=replace-me
TENON_AUTH0_CLIENT_SECRET=replace-me

NEXT_PUBLIC_TENON_AUTH0_CLAIM_NAMESPACE=https://tenon.ai
NEXT_PUBLIC_TENON_AUTH0_CANDIDATE_CONNECTION=replace-me
NEXT_PUBLIC_TENON_AUTH0_RECRUITER_CONNECTION=replace-me
```

3. Start the dev server:

```bash
npm run dev
```

4. Optional helper script (sets backend default then runs dev):

```bash
./runFrontend.sh
```

5. Basic health checks:

- Frontend: `http://localhost:3000/`
- Frontend health route (proxies backend health): `http://localhost:3000/api/health`

## Environment Variables (Complete)

The table below lists every env var referenced in source, configs, tests, or scripts.

| Variable                                       | Scope              | Required | Default / Example                      | Purpose                                                    |
| ---------------------------------------------- | ------------------ | -------- | -------------------------------------- | ---------------------------------------------------------- |
| `ANALYZE`                                      | build              | no       | `true` / `1`                           | Enables bundle analysis branch in `next.config.ts`.        |
| `NODE_ENV`                                     | runtime/build/test | no       | managed by Node/Next                   | Runtime mode checks (`development`, `production`, `test`). |
| `VERCEL_ENV`                                   | runtime/build      | no       | `development`, `preview`, `production` | Deployment-mode checks for route behavior.                 |
| `VERCEL_URL`                                   | runtime            | no       | `your-app.vercel.app`                  | Server-side base URL fallback.                             |
| `TENON_DEPLOY_ENV`                             | runtime/build      | no       | `production`                           | Additional deploy env switch for security headers.         |
| `TENON_BACKEND_BASE_URL`                       | runtime            | yes      | `http://localhost:8000`                | Backend upstream base URL for proxy/BFF forwarding.        |
| `TENON_APP_BASE_URL`                           | runtime            | yes      | `http://localhost:3000`                | Auth0 app base URL and callback handling.                  |
| `TENON_AUTH0_SECRET`                           | runtime            | yes      | secret string                          | Auth0 session encryption secret.                           |
| `TENON_AUTH0_DOMAIN`                           | runtime            | yes      | `tenant.us.auth0.com`                  | Auth0 tenant domain.                                       |
| `TENON_AUTH0_CLIENT_ID`                        | runtime            | yes      | client id                              | Auth0 client id.                                           |
| `TENON_AUTH0_CLIENT_SECRET`                    | runtime            | yes      | client secret                          | Auth0 client secret.                                       |
| `TENON_AUTH0_AUDIENCE`                         | runtime            | no       | API audience                           | Auth0 audience for access tokens.                          |
| `TENON_AUTH0_SCOPE`                            | runtime            | no       | scope string                           | Requested Auth0 scopes.                                    |
| `TENON_AUTH0_COOKIE_DOMAIN`                    | runtime            | no       | `.example.com`                         | Optional cookie domain override for `/auth/clear`.         |
| `TENON_DEBUG`                                  | runtime            | no       | `true`                                 | General debug switch used by proxy constants.              |
| `TENON_DEBUG_AUTH`                             | runtime            | no       | `true`                                 | Auth debug logs for BFF token/permission flow.             |
| `TENON_DEBUG_PERF`                             | runtime            | no       | `true` / `1`                           | Perf timing logs in middleware/BFF/proxy routes.           |
| `TENON_DEBUG_PROXY`                            | runtime            | no       | `true`                                 | Backend proxy request debug logging.                       |
| `TENON_PROXY_MAX_BODY_BYTES`                   | runtime            | no       | `2097152`                              | Input body size cap for backend proxy.                     |
| `TENON_PROXY_MAX_RESPONSE_BYTES`               | runtime            | no       | `2097152`                              | Upstream response size cap for backend proxy.              |
| `TENON_USE_FETCH_DISPATCHER`                   | runtime            | no       | `true` / `1`                           | Enables dispatcher branch in BFF robust fetch.             |
| `NEXT_PUBLIC_TENON_API_BASE_URL`               | runtime (client)   | yes      | `/api/backend`                         | Frontend default API base path.                            |
| `NEXT_PUBLIC_TENON_APP_BASE_URL`               | runtime (client)   | no       | `http://localhost:3000`                | Client base URL fallback for auth links.                   |
| `NEXT_PUBLIC_TENON_AUTH0_CANDIDATE_CONNECTION` | runtime (client)   | yes      | Auth0 connection                       | Candidate login connection hint.                           |
| `NEXT_PUBLIC_TENON_AUTH0_RECRUITER_CONNECTION` | runtime (client)   | yes      | Auth0 connection                       | Recruiter login connection hint.                           |
| `NEXT_PUBLIC_TENON_AUTH0_CLAIM_NAMESPACE`      | runtime (client)   | yes      | `https://tenon.ai`                     | Namespaced claim key base for roles/permissions.           |
| `NEXT_PUBLIC_TENON_DEBUG_ERRORS`               | runtime (client)   | no       | `true` / `1`                           | Enables detailed client error messaging branch.            |
| `NEXT_PUBLIC_TENON_DEBUG_PERF`                 | runtime (client)   | no       | `true` / `1`                           | Client perf logging switch.                                |
| `NEXT_PUBLIC_TENON_MEDIA_ALLOWED_ORIGINS`      | runtime/build      | no       | CSV origins                            | CSP media source allow-list extension.                     |
| `NEXT_PUBLIC_VERCEL_URL`                       | runtime (client)   | no       | `your-app.vercel.app`                  | Client base URL fallback.                                  |
| `CI`                                           | test               | no       | `true`                                 | CI mode for Playwright config behavior.                    |
| `E2E_BASE_URL`                                 | test               | no       | `http://127.0.0.1:3000`                | Base URL for default Playwright lane.                      |
| `E2E_BASELINE_RESULTS_JSON`                    | test               | no       | path to JSON                           | Baseline perf/result file for E2E lane.                    |
| `E2E_CANDIDATE_TOKEN`                          | test               | no       | `test-token`                           | Candidate token fixture for E2E tests.                     |
| `E2E_DAY_ONE_RESPONSE`                         | test               | no       | sample text                            | Day 1 response fixture for E2E tests.                      |
| `E2E_INTEGRATION_BASE_URL`                     | test               | no       | `http://127.0.0.1:3300`                | Base URL for integration-lane Playwright suite.            |
| `E2E_INTEGRATION_ARTIFACTS_DIR`                | test               | no       | output dir path                        | Artifact output dir for integration-lane Playwright.       |
| `QA_E2E_BASE_URL`                              | test               | no       | `http://127.0.0.1:3200`                | Base URL for `tests/e2e/flow-qa` suite.                    |
| `QA_E2E_ARTIFACTS_DIR`                         | test               | no       | output dir path                        | Artifact output dir for flow-qa suite.                     |
| `QA_E2E_STORAGE_DIR`                           | test               | no       | storage dir path                       | Storage state dir for flow-qa auth setup.                  |
| `QA_E2E_RECRUITER_EMAIL`                       | test               | no       | recruiter email                        | Recruiter identity for flow-qa setup checks.               |
| `QA_E2E_CANDIDATE_EMAIL`                       | test               | no       | candidate email                        | Candidate identity for flow-qa setup checks.               |
| `QA_ENFORCE_PERF_BUDGETS`                      | test               | no       | `1`                                    | Enables perf budget enforcement in flow-qa fixtures.       |
| `FLOW_QA_CONTRACT_SUMMARY_PATH`                | test               | no       | output file path                       | Contract summary output path for flow-qa validation tool.  |
| `TENON_PERF_MODE`                              | test/perf          | no       | `live`                                 | Flow-qa perf mode selector.                                |
| `TENON_PERF_SAMPLE_COUNT`                      | test/perf          | no       | `3`                                    | Perf sample count.                                         |
| `TENON_PERF_RUN_LABEL`                         | test/perf          | no       | `baseline`                             | Perf run label.                                            |
| `TENON_PERF_PASS_NAME`                         | test/perf          | no       | `pass1`                                | Perf pass label.                                           |
| `TENON_PERF_PASS_DIR`                          | test/perf          | no       | dir path                               | Perf output pass directory.                                |
| `TENON_PERF_OUTPUT`                            | test/perf          | no       | file path                              | Perf summary output path.                                  |
| `TENON_PERF_INTERACTION_OUTPUT`                | test/perf          | no       | file path                              | Perf interaction output path.                              |
| `TENON_PERF_PAGE_INVENTORY_OUTPUT`             | test/perf          | no       | file path                              | Perf page inventory output path.                           |
| `TENON_PERF_RAW_ARTIFACTS_DIR`                 | test/perf          | no       | dir path                               | Raw perf artifact directory.                               |
| `TENON_PERF_SIMULATION_ID`                     | test/perf          | no       | simulation id                          | Live perf simulation id.                                   |
| `TENON_PERF_CREATED_SIMULATION_ID`             | test/perf          | no       | simulation id                          | Created simulation id for perf runs.                       |
| `TENON_PERF_CANDIDATE_SESSION_ID`              | test/perf          | no       | candidate session id                   | Candidate session id for perf runs.                        |
| `TENON_PERF_INVITE_TOKEN`                      | test/perf          | no       | invite token                           | Invite token for perf candidate flow.                      |
| `TENON_PERF_LIVE_CREATE_MUTATION`              | test/perf          | no       | `1`                                    | Enables live create mutation in perf lane.                 |
| `LOADTEST_URL`                                 | script             | no       | `http://localhost:3000/api/dashboard`  | Autocannon target URL (`loadtest:dashboard`).              |
| `LOADTEST_CONN`                                | script             | no       | `20`                                   | Autocannon connection count.                               |
| `LOADTEST_DURATION`                            | script             | no       | `20`                                   | Autocannon duration (seconds).                             |
| `LOADTEST_COOKIE`                              | script             | no       | cookie header value                    | Optional cookie auth for load test.                        |
| `LOADTEST_AUTH_HEADER`                         | script             | no       | bearer token string                    | Optional auth header for load test.                        |
| `COVERAGE_TARGET`                              | script             | no       | `99`                                   | Coverage threshold for `scripts/checkCoverage.js`.         |
| `GREEN_COLOR`                                  | script             | no       | ANSI color code                        | Coverage script output styling.                            |
| `RESET_COLOR`                                  | script             | no       | ANSI reset code                        | Coverage script output styling reset.                      |
| `BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA`     | script             | no       | `true`                                 | Suppresses browserslist outdated-data warnings.            |
| `BROWSERSLIST_IGNORE_OLD_DATA`                 | script             | no       | `true`                                 | Suppresses browserslist outdated-data warnings.            |

## Project Structure (Annotated)

- `src/app`: App Router pages/layouts/loading states and all `/api/*` route handlers.
- `src/features/auth`: login/logout/error flows and auth route UI.
- `src/features/candidate`: candidate dashboard/session/task flows and candidate API modules.
- `src/features/recruiter`: recruiter dashboard/simulations/submissions/fit-profile flows and recruiter API modules.
- `src/platform/api-client`: shared request client, caching, error mapping.
- `src/platform/auth0`: Auth0 client/session/token utilities.
- `src/platform/middleware`: auth/routing/perf middleware logic.
- `src/platform/server`: BFF forwarding and backend proxy implementation.
- `src/shared`: shared UI components, query provider, notifications provider, common hooks.
- `tests/unit`: unit tests.
- `tests/integration`: integration tests (run through Jest).
- `tests/e2e`: Playwright suites (default, integration-lane, flow-qa).
- `docs/frontend`: canonical frontend documentation index + catalogs + API/pages maps.

## Commands

### Development

```bash
npm run dev
```

### Unit + Integration (Jest)

```bash
npm test
```

Optional scoping:

```bash
npm test -- tests/unit
npm test -- tests/integration
```

### Typecheck

```bash
npm run typecheck
```

### Lint

```bash
npm run lint
```

### Production Build and Start

```bash
npm run build
npm run start
```

### E2E (Playwright)

```bash
npm run test:e2e
```

Additional suites:

```bash
npx playwright test -c tests/e2e/integration-lane/playwright.config.ts
npx playwright test -c tests/e2e/flow-qa/playwright.config.ts
```

## Key User Flows

### Candidate

1. Candidate opens invite link (`/candidate/session/[token]`) and authenticates.
2. Bootstrap resolves claimed session and schedule/window state.
3. Candidate works daily tasks:

- Day 1 text submission.
- Day 2/3 coding tasks with Codespace status/init and run polling.
- Day 4 handoff upload flow (init upload, upload to signed URL, complete, transcript status, delete).
- Day 5 structured reflection form with draft autosave and validation.

4. Submission and completion state are reflected in current-task refresh and progress UI.

### Recruiter

1. Recruiter signs in and lands on dashboard (`/dashboard`).
2. Creates simulation (`/dashboard/simulations/new`).
3. Invites candidates and resends invites from simulation detail.
4. Reviews simulation detail (`/dashboard/simulations/[id]`), candidates, compare table, scenario controls.
5. Reviews candidate submissions and artifacts.
6. Views/generates fit profile (`/dashboard/simulations/[id]/candidates/[candidateSessionId]/fit-profile`).

## API Client and Auth Overview

- `apiClient`: general client, often used by candidate modules with `basePath: '/api/backend'`.
- `recruiterBffClient`: recruiter client defaulting to `basePath: '/api'`.
- `/api/backend/[...path]`: authenticated proxy route that forwards to backend `/api/{path}` with request guards.
- Recruiter `/api/*` route handlers use `requireBffAuth`/`withRecruiterAuth` and forward to backend `/api/*`.
- Middleware enforces route role gating:
- candidate routes (`/candidate*`, `/candidate-sessions*`) require `candidate:access`.
- recruiter routes (`/dashboard*`) require `recruiter:access`.

See detailed endpoint mapping in `docs/frontend/api-integration.md`.

## Coding Conventions

- TypeScript-first; keep types explicit at module boundaries.
- ESLint rules enforced in `src/**/*` include:
- `@typescript-eslint/no-explicit-any: error`
- `no-comments/disallowComments: error`
- `no-console: error`
- Prefer feature-local APIs/hooks and `src/platform/*` shared infra over ad-hoc fetch logic.
- Use React Query for async cache/state (`QueryProvider` in root layout).
- Use shared notifications for user-visible async outcomes.

## Frontend Docs Index

- `docs/frontend/README.md`
- `docs/frontend/inventory.md`
- `docs/frontend/routes.md`
- `docs/frontend/flows.md`
- `docs/frontend/api-integration.md`
- `docs/frontend/api-map.md`
- `docs/frontend/pages.md`
- `docs/frontend/components-catalog.md`
- `docs/frontend/hooks-catalog.md`
- `docs/frontend/utilities-catalog.md`
- `docs/frontend/config.md`
- `docs/frontend/local-dev.md`
- `docs/frontend/planned.md`
