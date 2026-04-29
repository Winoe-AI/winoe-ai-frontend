# PR: Fix Trial-scoped Benchmarks comparison

## Summary

Closes #189.

This PR fixes the Talent Partner Trial detail Benchmarks panel so it only renders eligible candidates from the selected Trial and displays the required Benchmarks framing, cohort context, and Winoe Report links.

## What changed

- Renamed the Trial detail comparison surface to `Benchmarks`.
- Added cohort-size copy, for example `Comparing 2 candidates for this Trial`.
- Added the limited-comparison note when the rendered cohort has fewer than 3 candidates.
- Added decision-boundary copy clarifying that Winoe surfaces evidence and the Talent Partner makes the hiring decision.
- Preserved Trial identifiers during compare normalization.
- Added defensive same-Trial filtering when row-level Trial identifiers are present.
- Restricted Benchmarks rows to terminal/report-ready candidates:
  - `completed + ready`
  - `evaluated + ready`
- Excluded in-progress, non-ready, and unrelated-Trial rows.
- Simplified the Benchmarks table to the required fields:
  - candidate name
  - Winoe Score
  - dimensional summary
  - evidence/recommendation summary
  - Winoe Report link
- Kept the Benchmarks surface read-only; Winoe Report generation remains on the dedicated Winoe Report page.
- Avoided retired terminology and deterministic hiring language.

## Why

Benchmarks are only trustworthy if they compare candidates from the same Trial, under the same Winoe instance and same evaluation lens. The previous comparison surface could show unrelated candidates, which broke the trust model for Talent Partners.

This PR makes the UI match the product promise: same-Trial Benchmarks with evidence-backed, non-deterministic framing.

## Acceptance criteria

- [x] Benchmarks table only shows candidates invited to / associated with the selected Trial.
- [x] Each row shows candidate name, Winoe Score, dimensional summary, evidence/recommendation summary, and Winoe Report link.
- [x] No-data state appears when no eligible completed/report-ready candidates exist.
- [x] Primary label is `Benchmarks`, not just `Compare`.
- [x] Copy avoids implying Winoe makes the hiring decision.
- [x] Header displays cohort size.
- [x] Limited-comparison note appears when rendered cohort size is less than 3.
- [x] Verified with at least 2 same-Trial candidates rendering as distinct rows with distinct Winoe Scores.
- [x] `in_progress + ready` rows are excluded.
- [x] `evaluated + ready` rows from the live backend payload are included.
- [x] No retired terminology introduced.

## Testing

Automated checks run:

```bash
npx jest tests/unit/features/talent-partner/trial-management/detail/TalentPartnerTrialDetailPage.component.interactions.test.tsx --runInBand
npx jest tests/unit/features/talent-partner/trial-management/detail/TalentPartnerTrialDetailPage.component.interactions.test.tsx --runInBand --detectOpenHandles
npx jest tests/unit/features/talent-partner/trial-management/detail/candidatesCompareNormalize.test.ts tests/unit/features/talent-partner/trial-management/detail/components/CandidateCompareSection.rows.test.tsx tests/unit/features/talent-partner/trial-management/detail/components/CandidateCompareSection.states.test.tsx tests/integration/talent-partner/TrialDetailPageClient.compareStates.test.tsx tests/integration/talent-partner/TrialDetailPageClient.compareRetry.test.tsx --runInBand
npm run typecheck
npm run lint:eslint
npm run lint:prettier
./precommit.sh
```

All passed.

Full precommit result:

- Test Suites: 502 passed, 502 total
- Tests: 1566 passed, 1566 total
- Snapshots: 3 passed, 3 total
- Typecheck: pass
- Build: pass
- Precommit: pass

## Manual QA

Manual QA was performed against the local frontend and backend.

Environment:

- Backend: local backend via `./runBackend.sh up`
- Frontend: local frontend via `npm run dev`
- Talent Partner account used for login
- Trial tested: seeded Trial 1 because Trial 2 was unavailable in the local DB after reseeding

Evidence saved under:

```txt
.ai_flow/qa/issue-189/
```

Artifacts:

- `01-dashboard.png`
- `02-trial-detail.png`
- `03-benchmarks-panel.png`
- `04-winoe-report.png`
- `summary.json`

Observed QA result:

- Compare endpoint observed: `/api/trials/1/candidates/compare`
- Rendered rows:
  - `Avery Chen — 91%`
  - `Jordan Patel — 74%`
- Header rendered: `Comparing 2 candidates for this Trial`
- Limited-comparison note rendered: `Limited comparison — results are more meaningful with additional candidates.`
- Decision-boundary copy rendered: `Winoe surfaces evidence from each Trial. The Talent Partner makes the hiring decision.`
- Winoe Report link navigation checked.
- Empty state did not render when eligible rows existed.
- No retired terminology observed.
- No deterministic hiring language observed.

## Notes / risks

- Frontend same-Trial filtering is defensive when row-level Trial IDs are present.
- If the backend omits row-level Trial IDs, the UI relies on the Trial-scoped endpoint contract: `/api/trials/:trialId/candidates/compare`.
- The live backend uses `evaluated` as a terminal compare status, so the frontend treats both `completed` and `evaluated` as eligible terminal states.
- The final diff is scoped to #189; unrelated Jest/global timeout changes were removed.

