# Local Development

## 1) Install

```bash
npm install
```

## 2) Configure `.env.local`

Minimum viable local config:

```bash
WINOE_BACKEND_BASE_URL=http://localhost:8000
NEXT_PUBLIC_WINOE_API_BASE_URL=/api/backend

WINOE_APP_BASE_URL=http://localhost:3000
WINOE_AUTH0_SECRET=replace-me
WINOE_AUTH0_DOMAIN=replace-me
WINOE_AUTH0_CLIENT_ID=replace-me
WINOE_AUTH0_CLIENT_SECRET=replace-me

NEXT_PUBLIC_WINOE_AUTH0_CLAIM_NAMESPACE=https://winoe.ai
NEXT_PUBLIC_WINOE_AUTH0_CANDIDATE_CONNECTION=replace-me
NEXT_PUBLIC_WINOE_AUTH0_TALENT_PARTNER_CONNECTION=replace-me
```

For complete env coverage (test/perf/script vars included), use root `README.md`.

## 3) Start Frontend

```bash
npm run dev
```

Optional wrapper:

```bash
./runFrontend.sh
```

## 4) Basic Route and API Checks

In another shell:

```bash
curl -i http://localhost:3000/
curl -i http://localhost:3000/api/health
```

Expected:

- `/` returns HTML.
- `/api/health` returns JSON health payload (or upstream failure details if backend is unavailable).

## 5) Common Commands

```bash
npm run lint
npm test
npm run typecheck
npm run build
npm run start
npm run test:e2e
```

Targeted Jest runs:

```bash
npm test -- tests/unit
npm test -- tests/integration
```

Additional Playwright suites:

```bash
npx playwright test -c tests/e2e/integration-lane/playwright.config.ts
npx playwright test -c tests/e2e/flow-qa/playwright.config.ts
```

## 6) Local QA Session Bootstrap (Task 3)

Use this local-only route to create an Auth0-compatible dev session cookie and
land directly on Task 3 surfaces without external Universal Login:

```bash
# Talent Partner dashboard QA entry
open "http://localhost:3000/api/dev/qa-login?role=talent_partner&returnTo=%2Fdashboard%2Ftrials"

# Candidate QA entry (for role-boundary checks)
open "http://localhost:3000/api/dev/qa-login?role=candidate&returnTo=%2Fcandidate%2Fdashboard"
```

Notes:

- Route is disabled outside local development and returns `404` in production.
- Requires `WINOE_AUTH0_SECRET` in `.env.local`.
- Optional query params:
  - `email` (override the QA email used in the cookie session)
  - `returnTo` (safe relative route only; auth/internal paths are sanitized)
