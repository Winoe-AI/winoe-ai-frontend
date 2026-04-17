## 1. Title

P0 Talent Partner dashboard: repair Trial counts and lifecycle status after backend schema migration (#175)

## 2. Why

- Dashboard counts were incorrect because backend data had previously been cross-contaminated across Trials.
- After the backend fixes landed, the frontend needed to render the corrected canonical dashboard payload faithfully.
- This issue is a demo blocker and maps to #175 acceptance criteria.

## 3. What changed

- Renamed `simError` to `trialsError` through the active dashboard state/query/page path.
- Normalized dashboard Trial rows so `candidateCount` is stable and numeric at the frontend boundary.
- Added lifecycle `status` support for dashboard Trial rows and badges.
- Updated dashboard Trial row rendering to show candidate count and lifecycle badge without legacy template copy.
- Updated tests covering:
  - `trialsError`
  - zero-invite Trial count rendering
  - lifecycle status rendering
  - normalized dashboard/list contract
- Cleaned adjacent active create-flow pivot debt:
  - removed active template selector usage
  - replaced legacy create-flow stack/template fields with optional `preferredLanguageFramework`
  - removed retired template-catalog dependency from the active create-flow surface

## 4. QA

Automated QA:

- `npm run lint` - pass
- `npm run typecheck` - pass
- `npm test -- --runInBand` - pass
- precommit checks - pass

Live QA:

- Backend started with `ENV_FILE=.env ./runBackend.sh`
- Frontend started with `./runFrontend.sh`
- Logged in through the real `/auth/login` flow using the provided Talent Partner credentials
- Verified `/api/debug/auth` returned `200` with Talent Partner auth context
- Verified `/api/dashboard` returned `200` in authenticated browser context
- Verified dashboard rendered only the logged-in Talent Partner's Trial data
- Verified a zero-invite Trial rendered `0 candidate(s)`
- Verified lifecycle status badge rendered correctly (`Generating` in the QA run)
- Verified Trial detail showed `No candidates yet`
- QA artifacts:
  - `qa_verifications/Contract-Live-QA/manual-qa/dashboard-after-login.png`
  - `qa_verifications/Contract-Live-QA/manual-qa/dashboard-with-api-created-trial.png`
  - `qa_verifications/Contract-Live-QA/manual-qa/created-trial-detail-api.png`

## 5. Risks / follow-ups

- During live QA, the active create form still 422'd against the current backend because the frontend now posts `preferredLanguageFramework` while this backend build still expects legacy create payload fields.
- That mismatch is a separate follow-up item and not part of #175 dashboard acceptance.
- This PR does not claim to fix the create-flow/backend contract mismatch.
