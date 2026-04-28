# Stabilize Winoe Report page with dimensional sub-scores, Evidence Trail drill-down, and persona compliance

## Summary

This PR stabilizes the Talent Partner Winoe Report page into a demo-ready artifact for issue #188.

It delivers the full report experience expected for YC-demo readiness:

- prominent Winoe Score hero
- canonical dimensional sub-scores
- from-scratch dimensions visible
- Evidence Trail drill-down
- per-day scores
- reviewer sub-agent summaries
- persona-compliant narrative language
- print-to-PDF support
- evidence-first recommendation language
- backend evidence linkage preservation

The report now reads as a trustworthy evidence review surface rather than a thin placeholder view.

## Product / UX Changes

- Winoe Score now displays prominently as `X / 100`.
- Dimensional breakdown always includes the canonical from-scratch dimensions:
  - Project scaffolding quality
  - Architectural coherence
  - Development process
  - Code quality
  - Testing discipline
  - Communication / Handoff + Demo
  - Reflection & self-awareness
- Dimension cards are clickable and keyboard-accessible.
- The drill-down panel shows linked Evidence Trail artifacts for each selected dimension.
- Dimensions without returned artifacts show honest empty states instead of fabricated content.
- Per-day scores show Day 1 through Day 5 with correct labels.
- Day 4 user-facing copy says `Handoff + Demo`.
- Reviewer sub-agent summaries are visible in the report.
- The Winoe narrative is evidence-first and non-determinative.
- The print-to-PDF layout is demo-safe.

## Backend Changes

Real QA initially failed because backend evidence sanitization stripped linkage fields needed for frontend association.

Root cause:

- Evidence artifacts existed in the DB and in report composition.
- The backend report composer/schema stripped the fields needed by the frontend to map evidence into dimensions.
- This caused all dimensions to render `0 linked artifacts`.

Backend fix:

- Preserve evidence linkage fields in the Winoe Report API payload:
  - `dimensionKey`
  - `dimensionLabel`
  - `dayLabel`
  - `sourceLabel`
  - `label`
  - `title`
  - `description`
  - `anchor`
- Extend the backend Winoe Report evidence schema.
- Add backend tests proving evidence linkage survives the sanitizer/composer/API shape.

## Frontend Changes

- Report normalization now handles older and newer payload aliases.
- Explicit backend dimensions override derived dimensions when both are present.
- Derived day-level rubric and evidence fill gaps where the backend response is partial.
- Canonical fallback dimensions remain visible with truthful pending/empty states.
- Evidence rendering supports:
  - commits
  - commit ranges
  - docs
  - transcript timestamps
  - file timelines
  - code structure
  - tests
  - coverage
  - reflection excerpts
  - reviewer excerpts
- Deterministic recommendation helpers were removed and replaced with evidence-language formatting.
- Candidate compare row recommendation copy now uses evidence-language copy.

## Persona / Terminology Compliance

Confirmed user-facing copy avoids these retired or disallowed terms:

- `Tenon`
- `SimuHire`
- `recruiter`
- `simulation`
- `Fit Profile`
- `Fit Score`
- `template`
- `precommit`
- `Specializor`

Confirmed the UI does not use deterministic recommendation labels like:

- `Hire`
- `Reject`
- `Pass`
- `Fail`
- `Proceed`
- `Do not proceed`
- `Recommended hire`
- `Not recommended`

Confirmed the UI uses the intended Winoe vocabulary:

- `Winoe`
- `Winoe AI`
- `Trial`
- `Winoe Report`
- `Winoe Score`
- `Evidence Trail`
- `Talent Partner`
- `Handoff + Demo`

## QA Evidence

### Local E2E QA

- Frontend URL: `http://localhost:3000`
- Backend URL: `http://localhost:8000`
- Route tested: `http://localhost:3000/dashboard/trials/1/candidates/1/winoe-report`
- Account used: `robel.kebede@bison.howard.edu`
- Auth confirmed via `/api/debug/auth`
  - `roles: ["talent_partner"]`
  - `permissions: ["talent_partner:access"]`
- Onboarding completed for:
  - `companyId: 1`
  - `companyName: "Winoe Demo Company"`
- Live payload endpoint: `/api/candidate_sessions/1/winoe_report`
- Live payload status: `ready`
- Evidence linkage present in payload and rendered in UI.
- Winoe Score observed: `81 / 100`
- QA target note: the original Iteration 5 note referenced `trial 2`, but the current local seed snapshot contains the valid ready report at `trial 1 / candidate session 1`.

### Artifacts

```text
test-results/iteration-7-winoe-report.png
test-results/iteration-7-evidence-drilldown.png
test-results/iteration-7-winoe-report.pdf
test-results/iteration-7-browser-qa.json
```

## Validation Commands

### Frontend

```bash
npm run lint
npm run typecheck
npx jest --runInBand tests/unit/features/talent-partner/winoe-report tests/integration/talent-partner/trials/candidates/WinoeReportPage.rendering.test.tsx tests/integration/talent-partner/trials/candidates/WinoeReportPage.interactions.test.tsx tests/integration/talent-partner/trials/candidates/WinoeReportPage.printProof.test.tsx tests/integration/talent-partner/trials/candidates/WinoeReportPage.errorStates.test.tsx tests/integration/talent-partner/trials/candidates/WinoeReportPage.pollingGenerate.test.tsx
npx jest --runInBand tests/unit/features/talent-partner/trial-management/detail/components/CandidateCompareSection.rows.test.tsx tests/integration/talent-partner/TrialDetailPageClient.compareStates.test.tsx
./precommit.sh
```

Results:

- `npm run lint` — pass
- `npm run typecheck` — pass
- Winoe Report focused tests — pass
- Compare regression tests — failed once, then passed on rerun in a fresh Jest process
- `./precommit.sh` — pass
- Full frontend gate — `502/502` test suites passed, `1565/1565` tests passed, build passed

### Backend

```bash
set -a && source .env && set +a && PYTHONPATH=. ./.venv/bin/pytest -q --no-cov tests/evaluations/services/test_evaluations_winoe_report_composer_sanitize_evidence_service.py tests/evaluations/services/test_evaluations_winoe_report_composer_service.py tests/shared/http/routes/test_shared_http_routes_winoe_report_and_jobs_routes.py

set -a && source .env && set +a && PYTHONPATH=. ./.venv/bin/pytest -q --no-cov tests/evaluations/services/test_evaluations_winoe_report_api_fetch_service.py
```

Results:

- backend Winoe Report composer/sanitizer/routes tests — pass
- backend API fetch service tests — pass
- `./runBackend.sh migrate` — pass
- `./runBackend.sh bootstrap-local` — pass
- `./runBackend.sh` — pass
- `curl -i http://localhost:8000/health` — pass
- `curl -i http://localhost:8000/ready` — pass

## Risks / Notes

- The compare regression test showed one transient flake, then passed on rerun and passed in full precommit.
- Local seed data currently validates against `trial 1 / candidate session 1`, not stale `trial 2`.
- Backend evidence linkage is preserved now, but future backend taxonomy changes may require frontend alias updates.
- No remaining blocker for #188.

## Ready Status

Fixes #188
