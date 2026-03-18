## 1. Title

P2 Recruiter: Candidate comparison table (Fit Score + key subscores) inline on simulation detail candidates surface (#144)

## 2. TL;DR

- Added an inline recruiter `Compare candidates` table on the simulation detail candidates section for side-by-side decision support.
- Added compare API/BFF plumbing for `GET /api/simulations/[id]/candidates/compare` and wired frontend consumption.
- Rows with missing Fit Profiles show `—` for score/recommendation plus a `Generate Fit Profile` CTA.
- Added explicit compare-state handling for `403`, `404`, and retryable generic failures with visible retry UI.
- Added sortable table headers and quick links per row to `View Submissions` and `View Fit Profile`.

## 3. Problem / Why

Recruiters needed a compact, decision-ready view to compare multiple candidate sessions without opening each candidate page. This improves decision speed for MVP/demo flows by surfacing Fit outcomes and next actions in one place.

## 4. What changed

### UI surface

- Added `CandidateCompareSection` and rendered it inline above the existing candidates table in simulation detail.
- Added comparison columns for candidate identity, status, Fit Profile status, Fit Score, recommendation, strengths/risks, and actions.
- Added quick row actions for submissions, Fit Profile, and Fit Profile generation when missing.

### Data/API integration

- Added Next BFF route `src/app/api/simulations/[id]/candidates/compare/route.ts` that forwards to backend compare endpoint.
- Added recruiter API client call `listSimulationCandidateCompare(...)`.
- Added typed normalization for compare payloads with resilient support for common backend field variants.

### State handling

- Added loading skeleton, empty state, partial-data handling (`—` + Generate), and error card with retry.
- Added explicit user-facing error messages for `403` and `404` compare responses plus retryable generic failure handling.
- Added polling while rows are in `generating` state so compare data refreshes to ready values.

### Security / trust posture

- Compare normalization sanitizes strengths/risks text and filters sensitive signed-URL/token-like content from rendered compare data.
- UI only consumes summary compare fields; no signed URLs or artifact payloads are displayed.

### Accessibility

- Sortable table headers expose `aria-sort` state.
- Status values are rendered with existing status-pill semantics and actions remain keyboard-accessible buttons/links.

### Tests

- Added and updated unit/integration coverage for compare route forwarding, normalization, compare UI states/actions/sorting, and simulation detail integration flows.

## 5. Key implementation details

- Compare section is placed inline in the simulation detail candidates section.
- Added compare endpoint route: `/api/simulations/[id]/candidates/compare`.
- Added typed normalization layer for compare rows (`CandidateCompareRow` + normalization helpers).
- Row actions include `View Submissions`, `View Fit Profile`, and conditional `Generate Fit Profile`.
- Table headers are sortable (`Candidate`, `Status`, `Fit Profile`, `Fit Score`).
- Compare polling runs while Fit Profiles are generating.
- Visible compare error states are handled for `403`, `404`, and generic failures.

## 6. Files changed

### UI and hooks

- `src/features/recruiter/simulations/detail/components/CandidateCompareSection.tsx`
- `src/features/recruiter/simulations/detail/components/sections/CandidatesSection.tsx`
- `src/features/recruiter/simulations/detail/hooks/useSimulationCandidatesCompare.ts`

### API/BFF and normalization

- `src/app/api/simulations/[id]/candidates/compare/route.ts`
- `src/features/recruiter/api/candidates.ts`
- `src/features/recruiter/api/candidatesCompare.ts`
- `src/features/recruiter/api/candidatesCompareNormalize.ts`
- `src/lib/server/backendProxy/requestSecurity.ts`

### Tests

- `tests/integration/recruiter/SimulationDetailPageClient.test.tsx`
- `tests/unit/app/api/candidatesCompareRoute.test.ts`
- `tests/unit/app/api/recruiterRoutes.test.ts`
- `tests/unit/app/api/routesCoverage.test.ts`
- `tests/unit/app/api/routesExtra.test.ts`
- `tests/unit/features/recruiter/simulation-detail/candidatesCompareNormalize.test.ts`
- `tests/unit/features/recruiter/simulation-detail/components/CandidateCompareSection.test.tsx`
- `tests/unit/lib/recruiterApi.test.ts`

## 7. Testing

### Automated validation (passed)

Passed commands:

- `npm test -- tests/unit/features/recruiter/simulation-detail/components/CandidateCompareSection.test.tsx tests/unit/features/recruiter/simulation-detail/candidatesCompareNormalize.test.ts tests/unit/app/api/candidatesCompareRoute.test.ts tests/unit/lib/recruiterApi.test.ts tests/integration/recruiter/SimulationDetailPageClient.test.tsx`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `./precommit.sh`

Final precommit test totals:

- `253 passed, 253 total`
- `1603 passed, 1603 total`

### Manual QA validation (passed)

- Verdict: `PASS — ready for PR raise`
- Manual QA evidence: `.qa/144/manual_qa_20260317_204055/QA_REPORT.md`
- Consolidated result artifact: `.qa/144/manual_qa_20260317_204055/artifacts/issue144_qa_result_final.json`
- Closure checks artifact: `.qa/144/manual_qa_20260317_204055/artifacts/issue144_closure_checks.json`

## 8. Screenshots / UI evidence

- Manual QA screenshot set: `.qa/144/manual_qa_20260317_204055/screenshots/`
- Manual QA evidence folder: `.qa/144/manual_qa_20260317_204055/`

## 9. Risks / follow-ups

- Compare error copy is currently hardcoded.
- Future enhancement can add richer comparison/filtering, but that is out of scope for this issue.

## 10. Rollout / demo notes

- Open a simulation with 2 candidates.
- Show one row with `—` plus `Generate Fit Profile`.
- Show one ready row with score/recommendation.
- Show `View Submissions` and `View Fit Profile` links.
- Show compare error handling when compare backend is unavailable.

## 11. Manual QA evidence

### Manual QA verdict

PASS — ready for PR raise

### Validated in manual QA

- Compare section presence
- 2-row rendering
- Partial row with `—` and `Generate Fit Profile`
- Ready row with Fit Score and recommendation
- Submissions navigation
- Fit Profile navigation
- Sorting interactions
- `403` / `404` / generic error UI behavior
- Retry recovery
- Trust/security inspection for no signed URL or sensitive artifact exposure

### Environment used

- Frontend branch: `feature/candidate-comparison-table-for-a-simulation-144`
- Frontend commit: `83d83bc5d6b46ddc9fcf109689b7c614396edbd3`
- Backend branch: `main`
- Backend commit: `97ba5ad1866bd1887f580b3a71a933d4e8dcda97`
- Frontend URL: `http://localhost:3000`
- Backend URL: `http://localhost:8000`

### Evidence references

- `.qa/144/manual_qa_20260317_204055/`
- `.qa/144/manual_qa_20260317_204055/QA_REPORT.md`
- `.qa/144/manual_qa_20260317_204055/artifacts/issue144_qa_result_final.json`
- `.qa/144/manual_qa_20260317_204055/artifacts/issue144_closure_checks.json`
- `.qa/144/manual_qa_20260317_204055/screenshots/`

### Manual QA limitations / notes

- The default local backend DB was schema-drifted, so manual QA used a fresh local QA database for reproducible runtime verification.
- `403` / `404` / generic `500` compare failures were validated via controlled Playwright interception, i.e. simulated UI error QA, not naturally occurring backend failures.
- No product code was modified during QA.

## 12. Final status

Implementation complete, automated checks are green, manual QA passed, and this issue is ready for PR raise.
