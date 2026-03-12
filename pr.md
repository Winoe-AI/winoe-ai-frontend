# Issue #143: Recruiter Fit Profile page + evidence trail + print-to-PDF demo flow

## Title

Recruiter Fit Profile page with evidence trail, generation polling, and print/PDF demo flow.

## TL;DR

- Added dedicated recruiter route `/dashboard/simulations/[id]/candidates/[candidateSessionId]/fit-profile` plus a Fit Profile entry link from Candidate Submissions.
- Implemented Fit Profile UI blocks: `FitScoreHeader`, `DayScoreCard`, `EvidenceList`, `FitProfileStatusPanel`, and warning banner support.
- Implemented generation + polling state machine with `not_generated`, `generating`, `ready`, `access_denied`, and `error` states.
- Implemented evidence trail rendering with safe external links (`target="_blank"`, `rel="noreferrer noopener"`) and visible printable URL text.
- Implemented print flow via `window.print()`, scoped print mode, shell chrome hide markers, and full-width content expansion.
- Added explicit `not_evaluated` day handling (including `disabledDayIndexes`) so excluded days render clearly as non-scored.

## Problem / Why

Recruiters needed a decisive, scannable output for candidate evaluation with an overall fit score, per-day scoring, and evidence citations, plus a print-friendly report view for demo usage. The existing candidate submissions page had no dedicated Fit Profile experience.

## What changed

- Dedicated route
  - Added route page at `src/app/(recruiter)/dashboard/simulations/[id]/candidates/[candidateSessionId]/fit-profile/page.tsx`.
  - Uses `FitProfilePage` with route metadata for recruiter fit reporting.
- Candidate submissions entry point
  - Added `Fit Profile` link in `SubmissionsHeader`.
  - Wired href from candidate submissions context: `/dashboard/simulations/${simulationId}/candidates/${candidateSessionId}/fit-profile`.
- Fit profile components
  - Added `FitProfilePage`, `FitScoreHeader`, `DayScoreCard`, `EvidenceList`, `FitProfileStatusPanel`, `FitProfileWarningBanner`, plus formatting/types files under `src/features/recruiter/simulations/candidates/fitProfile/`.
- Generate + polling state machine
  - `useFitProfile` drives GET/POST flow and transitions:
    - `not_generated`: initial or 404-not-found evaluation state.
    - `generating`: running state + auto-poll timer.
    - `ready`: report rendered.
    - `access_denied`: 403.
    - `error`: generic failure.
  - Polling interval is controlled by `FIT_PROFILE_POLL_INTERVAL_MS` and cleaned up on unmount.
- Evidence trail rendering
  - Evidence cards support commit/diff/test/transcript style evidence metadata (`kind`, `ref`, `excerpt`, timestamp range).
  - Evidence links open in new tab with safe rel attrs.
  - Visible printable URL text is shown under each link.
- Print / Save PDF flow
  - `Print / Save PDF` button calls `window.print()`.
  - `FitProfilePage` toggles body class `fit-profile-print-mode` while mounted.
  - Print mode is scoped, not global: `@media print` rules apply under `body.fit-profile-print-mode`.
- Not-evaluated day handling
  - Normalizer resolves day evaluation status from explicit flags/status values, null/missing score, and `disabledDayIndexes`.
  - Disabled days are materialized even if missing from `dayScores`.
  - `DayScoreCard` renders explicit `Not evaluated` badge + explanatory copy and excludes score display for those days.
- Print-shell markers / scoped print CSS
  - Added marker attributes:
    - `data-fit-profile-no-print="true"` on shell chrome (header/nav/skip-link and Fit Profile top action row).
    - `data-fit-profile-main-content="true"` on `<main>` container.
  - Print CSS hides marked chrome, expands main content (`max-width: none`, zero margins/padding), and keeps fit profile cards readable.

## Acceptance criteria coverage

- Recruiter can generate Fit Profile
  - `Generate Fit Profile` button triggers `POST /api/candidate_sessions/{id}/fit_profile/generate` and transitions into generating flow.
- Polling updates status correctly
  - Generating state auto-polls GET endpoint and transitions to ready when report becomes available.
- Report renders overall score + per-day scores
  - `FitScoreHeader` renders overall fit score/recommendation/calibration; `DayScoreCard` renders each day.
- Evidence links clickable
  - Evidence links render as anchors and open in new tab (`target="_blank"`).
- Print-to-PDF produces readable document
  - Print button + scoped print CSS + shell-hide markers + full-width main content + visible URL text.
- 409 "not ready" handled gracefully
  - GET 409 maps to generating/polling; POST 409 maps to "already running" generating state then polling.

## API / contract handling

- GET/POST fit profile endpoints
  - Frontend BFF proxies:
    - `GET /api/candidate_sessions/[candidateSessionId]/fit_profile`
    - `POST /api/candidate_sessions/[candidateSessionId]/fit_profile/generate`
  - Upstream backend paths forwarded as:
    - `GET /api/candidate_sessions/{candidate_session_id}/fit_profile`
    - `POST /api/candidate_sessions/{candidate_session_id}/fit_profile/generate`
- Support for status payloads and 409 progress semantics
  - `fitProfile.api.ts` supports status payloads (`not_started`, `running`, `ready`, `failed`) and report-in-root/report-nested variations.
  - `useFitProfile` also handles transport-level 409 as generation-in-progress.
- 403 / 404 / 409 / generic errors
  - 403 -> access denied panel.
  - 404 -> "Evaluation not found" + not-generated flow.
  - 409 -> generating + auto-poll.
  - Other failures -> error panel with retry.

## Security / privacy notes

- No report content logging
  - Fit Profile code path does not log report payloads or evidence excerpts.
- Safe evidence link behavior
  - Evidence links use `target="_blank"` and `rel="noreferrer noopener"`.
  - Only valid `http`/`https` URLs are rendered as clickable links.
- Printed visible URLs are sanitized / token-free
  - Printable URL text strips query/hash (`printableEvidenceUrl`) to avoid exposing signed token params in print output.

## Testing

- Targeted tests added/updated
  - `tests/integration/recruiter/simulations/candidates/FitProfilePage.test.tsx`
  - `tests/unit/features/recruiter/fit-profile/FitProfileComponents.test.tsx`
  - `tests/unit/shared/AppLayout.test.tsx`
- Targeted test coverage includes
  - generate flow, GET/POST 409 handling, polling transition to ready, 403/404/generic states, print button wiring, print-mode class toggling, warning banner rendering, evidence link safety, and explicit `not_evaluated` day rendering.
- Check results (latest iteration verification logs)
  - Targeted fit-profile/app-layout test command: PASS
  - `npm run lint`: PASS
  - `npm run typecheck`: PASS
  - `npm run build`: PASS
  - `precommit.sh`: PASS (exit code `0`, see `.ai_flow/sessions/20260312_000939/iterations/02/checks/precommit.exitcode`)

## Manual QA / demo proof

- Route entry point
  - Candidate submissions header includes a direct `Fit Profile` link to `/dashboard/simulations/[id]/candidates/[candidateSessionId]/fit-profile`.
- Generate / polling / ready flow validation
  - Validated by integration tests for not-generated, generating, 409 progression, and ready render states.
- Print-proof artifact validation
  - Browser artifact path used to validate print media behavior: generated HTML proof + screenshot + computed-style metrics JSON.
  - Metrics confirm shell hide and content expansion behavior in print media.
- Local auth limitation
  - Live authenticated recruiter-route print verification was blocked locally by Auth0 redirect, so artifact-backed print proof was used as fallback evidence in this environment.

## Artifacts

- Print proof HTML
  - `test-results/fit-profile-print-proof.html`
- Print proof screenshot
  - `test-results/fit-profile-print-proof.png`
- Print proof metrics JSON
  - `test-results/fit-profile-print-proof-metrics.json`
- Iteration diffs
  - `.ai_flow/sessions/20260312_000939/iterations/01/diff.patch`
  - `.ai_flow/sessions/20260312_000939/iterations/02/diff.patch`

## Risks / follow-ups

- Follow-up (non-blocking): re-run print verification on the live authenticated recruiter route in an environment with valid Auth0 recruiter session credentials.

## Rollout / demo checklist

- Open completed candidate session.
- Click `Fit Profile` from Candidate Submissions.
- Click `Generate Fit Profile` if needed.
- Wait for generating state to transition to ready report.
- Review overall fit score, recommendation calibration text, per-day cards, and evidence trail.
- Click `Print / Save PDF` and confirm print preview readability.

## Final status

Ready for PR raise.
