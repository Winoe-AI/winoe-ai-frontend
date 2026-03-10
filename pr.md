# Title

Issue #134: Recruiter scenario version controls (regenerate + edit + versioned approval)

## TL;DR

Issue #134 is PR-ready. Recruiter simulation detail now supports version-aware regenerate, edit, and approve flows with selected-version as the source of truth, honest handling of non-canonical historical versions, and final live QA evidence passing all required runtime checks.

## Problem

Recruiters need to iterate on scenarios before inviting candidates: regenerate new versions, make targeted edits, compare versions, and approve exactly the intended version. The UI also needed to enforce lock rules and avoid implying historical content availability that backend does not currently provide for non-active versions.

## What changed

- Added versioned scenario controls in `/dashboard/simulations/[id]`.
- Added `ScenarioVersionSelector` with per-version status and lock/availability cues.
- Added regenerate UX with confirmation modal and generating lifecycle display.
- Added scenario editor for `storylineMd`, `taskPrompts`, and `rubric` PATCH updates.
- Wired version-specific approval to selected version ID.
- Enforced lock semantics in UI and non-blocking `409 SCENARIO_LOCKED` handling.
- Updated scenario status presentation to stay truthful for local-only/unavailable selected versions.
- Kept observability metadata-only; no scenario body content is logged.

## Acceptance criteria coverage

- AC1 Regenerate creates new version and shows generating
  - Covered via regenerate confirm flow, local optimistic version seed, and visible `Generating vN...` state.
- AC2 Generated version reconciles correctly after completion
  - Covered via job polling and reconcile refresh; generating clears without reload after terminal job completion.
- AC3 Editable version updates preview
  - Covered via editor save (`PATCH`) and local/remote refresh showing updated scenario content.
- AC4 Locked version is read-only and 409 handled non-blockingly
  - Covered via UI disable rules plus non-blocking lock banner on `409 SCENARIO_LOCKED`.
- AC5 Approval uses selected version only
  - Covered via selected-version approve endpoint path; no legacy activate flow used for approval.

## Key implementation details

- Selected version as source of truth
  - `selectedScenarioVersionId` drives preview, editor state, and approval target.
- Regenerate flow + polling/reconciliation
  - `POST regenerate` seeds local generating version, then polls job status and reconciles to backend state.
- Truthful non-canonical historical/local-only handling
  - `contentAvailability` distinguishes `canonical`, `local_only`, and `unavailable`; non-canonical versions are treated honestly.
- Editor dirty draft preservation
  - Drafts are preserved per version in-session across version switches.
- Lock semantics / `SCENARIO_LOCKED`
  - Locked versions cannot be edited or approved; `409` shows a non-blocking warning banner.
- Selected-version approval endpoint
  - Approval posts to selected version path, not a simulation-level fallback.
- Page-level status/CTA consistency fix for local-only/unavailable selected versions
  - Page badges and CTAs now reflect selected-version truthfully, avoiding contradictory "ready" signals when selected content is local-only/unavailable.

## Backend contract alignment

Confirmed endpoints:

- `POST /api/simulations/{id}/scenario/regenerate`
- `PATCH /api/simulations/{id}/scenario/{scenarioVersionId}`
- `POST /api/simulations/{id}/scenario/{scenarioVersionId}/approve`

Confirmed backend limitation:

- Backend does not currently provide canonical non-active historical scenario content payload/endpoint.
- Frontend now degrades honestly for non-canonical historical versions rather than implying canonical preview/edit availability.

## Testing

Documentation pass note: no tests were re-run in this pass; this section reflects the latest approved evidence.

- Lint: PASS (`npm run lint`)
- Typecheck: PASS (`npm run typecheck`)
- Targeted tests: PASS
  - Command:
    - `npm test -- --runInBand tests/integration/recruiter/SimulationDetailScenarioVersions.test.tsx tests/integration/recruiter/SimulationDetailPageClient.test.tsx tests/unit/features/recruiter/api/simulationLifecycle.test.ts tests/unit/features/recruiter/simulation-detail/RecruiterSimulationDetailPage.helpers.test.ts`
  - Result summary:
    - `4` suites passed, `50` tests passed, `0` failed.

## Manual QA

Final approved live QA pass completed and accepted.

- QA bundle path: `.qa/issue134/manual_qa_20260310_1252/`
- Final verdict: `PASS` (see `.qa/issue134/manual_qa_20260310_1252/artifacts/final_verdict.json`)
- Runtime method: live frontend + backend + worker in `TENON_ENV=test` against isolated SQLite DB.
- Runtime verifications proven:
  - generating state clears without reload after terminal job completion
  - selected local-only state remains truthful
  - no page-level badge contradiction
  - CTA state remains truthful for selected local-only version
  - selected-version approval smoke passes
  - lock `409 SCENARIO_LOCKED` smoke passes non-blockingly

## QA results

- Final QA verdict: `PASS`
- Final approved evidence bundle: `.qa/issue134/manual_qa_20260310_1252/`
- Core evidence:
  - `.qa/issue134/manual_qa_20260310_1252/QA_REPORT.md`
  - `.qa/issue134/manual_qa_20260310_1252/artifacts/qa_result.json`
  - `.qa/issue134/manual_qa_20260310_1252/artifacts/critical_evidence.json`
  - `.qa/issue134/manual_qa_20260310_1252/artifacts/final_verdict.json`
  - `.qa/issue134/manual_qa_20260310_1252/artifacts/targeted_tests.log`

## Screenshots / evidence

- `.qa/issue134/manual_qa_20260310_1252/screenshots/03_A_generating_state_visible.png`
- `.qa/issue134/manual_qa_20260310_1252/screenshots/04_A_post_terminal_generating_cleared.png`
- `.qa/issue134/manual_qa_20260310_1252/screenshots/05_B_badge_consistency_state.png`
- `.qa/issue134/manual_qa_20260310_1252/screenshots/06_B_cta_truthful_state.png`
- `.qa/issue134/manual_qa_20260310_1252/screenshots/08_C_approval_selected_version_only.png`
- `.qa/issue134/manual_qa_20260310_1252/screenshots/09_C_lock_409_nonblocking_banner.png`

## Risks / follow-ups

- Non-blocking backend follow-up: expose canonical non-active historical scenario content to support full historical parity.
- Non-blocking wording nuance: selector chip copy for local-only/unavailable states can be further tuned for recruiter readability.

## Reviewer notes

- This is a documentation-only finalization pass; no product code changed.
- Frontend behavior intentionally does not overclaim backend historical content capabilities.
- Issue #134 is PR-ready based on the final approved live QA pass.
