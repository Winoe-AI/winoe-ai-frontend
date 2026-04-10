## 1. Title

P2 Talent Partner: Candidate comparison table (Winoe Score + key subscores) inline on trial detail candidates surface (#144)

## 2. TL;DR

- Added an inline talent_partner `Compare candidates` table on the trial detail candidates section for side-by-side decision support.
- Added compare API/BFF plumbing for `GET /api/trials/[id]/candidates/compare` and wired frontend consumption.
- Rows with missing Winoe Reports show `—` for score/recommendation plus a `Generate Winoe Report` CTA.
- Added explicit compare-state handling for `403`, `404`, and retryable generic failures with visible retry UI.
- Added sortable table headers and quick links per row to `View Submissions` and `View Winoe Report`.

## 3. Problem / Why

Talent Partners needed a compact, decision-ready view to compare multiple candidate sessions without opening each candidate page. This improves decision speed for MVP/demo flows by surfacing Fit outcomes and next actions in one place.

## 4. What changed

### UI surface

- Added `CandidateCompareSection` and rendered it inline above the existing candidates table in trial detail.
- Added comparison columns for candidate identity, status, Winoe Report status, Winoe Score, recommendation, strengths/risks, and actions.
- Added quick row actions for submissions, Winoe Report, and Winoe Report generation when missing.

### Data/API integration

- Added Next BFF route `src/app/api/trials/[id]/candidates/compare/route.ts` that forwards to backend compare endpoint.
- Added talent_partner API client call `listTrialCandidateCompare(...)`.
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

- Added and updated unit/integration coverage for compare route forwarding, normalization, compare UI states/actions/sorting, and trial detail integration flows.

## 5. Key implementation details

- Compare section is placed inline in the trial detail candidates section.
- Added compare endpoint route: `/api/trials/[id]/candidates/compare`.
- Added typed normalization layer for compare rows (`CandidateCompareRow` + normalization helpers).
- Row actions include `View Submissions`, `View Winoe Report`, and conditional `Generate Winoe Report`.
- Table headers are sortable (`Candidate`, `Status`, `Winoe Report`, `Winoe Score`).
- Compare polling runs while Winoe Reports are generating.
- Visible compare error states are handled for `403`, `404`, and generic failures.

## 6. Files changed

### UI and hooks

- `src/features/talent-partner/trials/detail/components/CandidateCompareSection.tsx`
- `src/features/talent-partner/trials/detail/components/sections/CandidatesSection.tsx`
- `src/features/talent-partner/trials/detail/hooks/useTrialCandidatesCompare.ts`

### API/BFF and normalization

- `src/app/api/trials/[id]/candidates/compare/route.ts`
- `src/features/talent-partner/api/candidates.ts`
- `src/features/talent-partner/api/candidatesCompare.ts`
- `src/features/talent-partner/api/candidatesCompareNormalize.ts`
- `src/lib/server/backendProxy/requestSecurity.ts`

### Tests

- `tests/integration/talent-partner/TrialDetailPageClient.test.tsx`
- `tests/unit/app/api/candidatesCompareRoute.test.ts`
- `tests/unit/app/api/talentPartnerRoutes.test.ts`
- `tests/unit/app/api/routesCoverage.test.ts`
- `tests/unit/app/api/routesExtra.test.ts`
- `tests/unit/features/talent-partner/trial-detail/candidatesCompareNormalize.test.ts`
- `tests/unit/features/talent-partner/trial-detail/components/CandidateCompareSection.test.tsx`
- `tests/unit/lib/talentPartnerApi.test.ts`

## 7. Testing

### Automated validation (passed)

Passed commands:

- `npm test -- tests/unit/features/talent-partner/trial-detail/components/CandidateCompareSection.test.tsx tests/unit/features/talent-partner/trial-detail/candidatesCompareNormalize.test.ts tests/unit/app/api/candidatesCompareRoute.test.ts tests/unit/lib/talentPartnerApi.test.ts tests/integration/talent-partner/TrialDetailPageClient.test.tsx`
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

- Open a trial with 2 candidates.
- Show one row with `—` plus `Generate Winoe Report`.
- Show one ready row with score/recommendation.
- Show `View Submissions` and `View Winoe Report` links.
- Show compare error handling when compare backend is unavailable.

## 11. Manual QA evidence

### Manual QA verdict

PASS — ready for PR raise

### Validated in manual QA

- Compare section presence
- 2-row rendering
- Partial row with `—` and `Generate Winoe Report`
- Ready row with Winoe Score and recommendation
- Submissions navigation
- Winoe Report navigation
- Sorting interactions
- `403` / `404` / generic error UI behavior
- Retry recovery
- Trust/security inspection for no signed URL or sensitive artifact exposure

### Environment used

- Frontend branch: `feature/candidate-comparison-table-for-a-trial-144`
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
