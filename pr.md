## 1. Title

P2 Security: CSRF posture for Next BFF routes (same-origin enforcement) + safe defaults (#130)

## 2. TL;DR

Frontend hardening for `/api/backend/*` is complete and PR-ready. Request execution is centralized through `requestCore -> bffFetch`, proxy mutation guardrails enforce method and same-origin policy, and caller usage is aligned to safe same-origin defaults without introducing browser bearer-token workarounds.

## 3. Problem / Why

MVP1 uses cookie-based sessions via Next.js BFF/proxy routes. With backend CSRF/CORS hardening in `tenon-backend#221`, frontend behavior had to align so cookie-authenticated mutations remain same-origin safe, unsafe request patterns are rejected consistently, and token hygiene is preserved.

## 4. What changed

- Added shared `bffFetch()` helper in `src/lib/api/client/bffFetch.ts`.
- Centralized request execution through `requestCore -> bffFetch` in `src/lib/api/client/requestCore.ts`.
- Migrated recruiter fallback path to helper-based execution in `src/features/recruiter/api/recruiterRequestFallback.ts`.
- Added path normalization and URL safety behavior in `src/lib/api/client/url.ts` and `src/lib/api/client/requestContext.ts`.
- Added proxy method-policy and same-origin mutation guardrails in `src/lib/server/backendProxy/requestSecurity.ts`, wired through `src/lib/server/backendProxy/proxy.ts`.
- Tightened `/api/backend/[...path]` route contract in `src/app/api/backend/[...path]/route.ts`.

## 5. Security posture changes

- `bffFetch()` rejects cross-origin absolute BFF URLs.
- `bffFetch()` rejects `mode: "no-cors"`.
- Browser usage defaults to same-origin-safe credentials behavior for BFF calls.
- `401/403` are normalized to safe generic user-facing messages.
- Proxy guardrails enforce method policy and same-origin behavior for cookie-authenticated unsafe methods.
- No browser bearer-token workaround was introduced.

## 6. API / route contract changes

- Mutation routes enforce explicit method policy.
- `GET` on mutation routes returns `405 Method Not Allowed`.
- Bad-origin cookie-authenticated mutation requests return `403`.
- Open-proxy behavior was not introduced; upstream targeting remains internal and constrained.

## 7. Helper / caller migration

- Primary BFF request execution now flows through `requestCore -> bffFetch`.
- Recruiter fallback path now uses helper-based execution.
- No direct browser `fetch("/api/backend/...")` bypass callers remain.

## 8. Path normalization / URL safety

- Path joining and normalization logic is centralized and reused.
- Already-prefixed API paths are handled safely (no double-prefixing).
- Unsafe URL patterns are blocked before dispatch.

## 9. Token hygiene audit result

- No client-side bearer-token persistence or transport workaround was added.
- Browser auth remains session-cookie based.
- This frontend branch does not redesign auth.
- This frontend branch does not implement a CSRF-token framework.

## 10. Automated tests / validation

- targeted regression suites: **PASS**
- broader recruiter/candidate suites: **PASS**
- full suite: **PASS**
- `250 passed`, `250 total`
- `1580 passed`, `1580 total`
- lint: **PASS**
- typecheck: **PASS**
- build: **PASS**
- precommit: **PASS**

## 11. Manual QA evidence

### Manual QA verdict

**PASS**

### Verified scenarios

- Recruiter create simulation -> PASS
- Recruiter view simulation detail -> PASS
- Recruiter send invite -> PASS
- Candidate claim invite -> PASS
- Candidate schedule start date -> PASS
- Negative cross-site mutation with `Origin: https://evil.example` -> PASS (`403`)
- Negative `GET` on representative mutation route -> PASS (`405`)

### Runtime/browser security observations

- Browser API traffic stayed on `localhost:3000` only.
- No direct browser requests were made to backend host `:8000`.
- No browser `Authorization` header was observed.
- Browser auth remained session-cookie based (`__session`).
- Candidate browser storage contained app/session state only, not bearer-token persistence.

### Evidence references

- `.qa/130/manual_qa_20260316_2327/QA_REPORT.md`
- Recruiter/candidate flow screenshots: `.qa/130/manual_qa_20260316_2327/screenshots/`
- Raw HTTP artifact (bad-origin POST): `.qa/130/manual_qa_20260316_2327/http/negative_bad_origin_post.txt`
- Raw HTTP artifact (GET-on-mutation): `.qa/130/manual_qa_20260316_2327/http/negative_get_on_mutation_route.txt`
- Playwright result/network artifacts: `.qa/130/manual_qa_20260316_2327/artifacts/issue130_playwright_result.json`, `.qa/130/manual_qa_20260316_2327/artifacts/issue130_playwright_network_events.json`, `.qa/130/manual_qa_20260316_2327/artifacts/issue130_playwright_console_events.json`

## 12. Manual QA runtime caveats

- Manual QA was performed in local runtime, not staging or production.
- Candidate claim/schedule initially failed under shorthand test bearer tokens because backend ownership checks required `email_verified=true`.
- QA switched to QA-only signed JWT + local JWKS to satisfy backend ownership checks.
- This was a QA runtime setup only, not a product-code change.
- Invite verification used an existing active simulation for the invite action because a newly created simulation remained in `generating` state locally without scenario-worker activation.
- Backend `#221` remains the source of truth for full Origin/Referer enforcement semantics.
- Backend `#129` remains related dependency context for broader token-endpoint cleanup.

## 13. Risks / dependencies

- Backend `#221` and `#129` remain dependency context outside this frontend branch.
- Method allow-policy and mutation-route classification must remain synchronized as backend route surfaces evolve.
- Local-runtime manual QA cannot substitute for staging/production verification.

## 14. PR readiness judgment

Frontend scope for issue #130 is complete and approved for PR raise, with local-runtime QA caveats and backend dependency context documented above.
