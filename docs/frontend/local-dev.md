# Local Development

## 1) Install

```bash
npm install
```

## 2) Configure `.env.local`

Minimum viable local config:

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
