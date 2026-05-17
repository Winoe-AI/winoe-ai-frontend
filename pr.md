# Task 7: Add Submission Review and Benchmarks/Compare Talent Partner surfaces

## Summary

This PR adds the Talent Partner-facing post-Trial review experience:

- Submission Review for raw candidate artifacts
- Benchmarks for same-Trial comparison
- Side-by-side Compare for 2-3 candidates
- Canonical Talent Partner Winoe Report route and actions
- Day 4 video/transcript interaction, including click-to-seek behavior

The goal is to let Talent Partners inspect evidence, compare candidates within the same Trial, and follow the canonical `/talent-partner/...` route namespace without relying on legacy dashboard paths.

## What changed

### Submission Review

- Added the route at `/talent-partner/trials/[id]/candidates/[candidateSessionId]/submission`.
- Added the five-day tabbed artifact viewer:
  - Day 1 markdown Design Doc
  - Day 2 code artifact viewer
  - Day 3 code artifact viewer
  - Day 4 Handoff + Demo video/transcript
  - Day 5 markdown Reflection
- Day 2 and Day 3 now render real code artifacts with:
  - file tree
  - selectable files
  - Prism syntax highlighting
  - line numbers
  - commit timeline
  - selected-file and deep-link behavior where available
- Day 4 now includes:
  - video player
  - transcript panel
  - click-to-seek behavior
  - pending seek handling until media readiness
  - active segment highlight
- Added honest empty states for missing artifacts instead of implying data exists when it does not.

### Benchmarks

- Added the routes at `/talent-partner/benchmarks` and `/talent-partner/trials/[id]/benchmarks`.
- Added:
  - Trial selector
  - status filter
  - time range filter
  - cohort summary
  - median / mean / range / n
  - sufficient / limited sample badge
  - required `n < 3` caveat
  - candidate table
  - dimension sparklines
  - report-pending handling
  - multi-select compare bar
- Kept the fairness copy explicit: `Same Trial. Same Winoe instance. Same rubric.`

### Compare

- Added `/talent-partner/benchmarks/compare?candidates=...`.
- Supports:
  - 2 candidates
  - 3 candidates
  - max 3 selection cap
  - ScoreRing / RadarChart / dimensional list where data is available
  - canonical report and submission links
  - fairness note
- Avoids “winner” language and keeps the comparison framed as same-Trial evidence review.

### Winoe Report integration

- Added the canonical route at `/talent-partner/trials/[id]/candidates/[candidateSessionId]/winoe-report`.
- Kept the legacy dashboard route available for compatibility.
- Added or restored actions:
  - `View raw submission`
  - `Open Benchmarks`
- Ensured Task 7-visible links use canonical `/talent-partner/...` paths.

### Trial Detail

- Added the `View submission` entry point.
- Fixed the completed-candidate summary copy so it no longer says `No completed candidates yet` when completed candidates exist but reports are not benchmark-ready.

## Manual QA

- Local frontend and backend were running during QA.
- Talent Partner login was used.
- Day 2 artifacts were verified.
- Day 3 artifacts were verified.
- Day 4 transcript seek was verified with `video.currentTime` moving from `0` to `35`.
- Canonical Winoe Report route was verified.
- Winoe Report actions were verified.
- Benchmarks report links were verified.
- Compare canonical links were verified.
- Route namespace was verified.
- No banned visible terminology was found in the reviewed Task 7 surfaces.
- Screenshots were local-only and were not committed.

Browser proof:

- Route: `/talent-partner/trials/2/candidates/5/submission`
- Segment clicked: `00:35 Implementation walkthrough.`
- `video.currentTime` before click: `0`
- `video.currentTime` after click: `35`
- Seek worked: `yes`
- Active highlight updated: `yes`

## Tests

- `npm test -- --runInBand tests/unit/features/talent-partner/submission-review/SubmissionReviewPage.test.tsx`
- `./precommit.sh`

Final frontend precommit passed:

- `526 suites passed`
- `1678 tests passed`
- `typecheck passed`
- `build passed`

## Risk / follow-up

- Fake/local QA media artifacts were not committed.
- Transcript seek depends on seekable media; backend fake-storage Range support is included in the backend PR.
- Legacy `/dashboard/...` routes remain compatibility-only.
