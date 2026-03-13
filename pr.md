# 1. Title

Issue #146: Recruiter per-day AI evaluation toggles in create flow, preview state rendering, and Fit Profile disabled-day handling.

# 2. TL;DR

- Added compact per-day AI evaluation toggles to simulation create (`Day 1`..`Day 5`), default enabled.
- Create submit now persists the nested backend contract shape under `ai.evalEnabledByDay`.
- Simulation detail/preview now renders per-day AI state (`Enabled` / `Disabled`) with disabled-day `Human Review Required` messaging.
- Fit Profile now suppresses AI score content for disabled days and renders explicit human-review-only messaging.
- Edit flow was intentionally not implemented because this repo has no existing recruiter simulation edit route/screen to extend safely.

# 3. Issue / Problem

Recruiters need per-day control over whether AI evaluation is active so they can enforce clear human-vs-AI boundaries and compliance posture. Backend persistence exists; frontend needed to expose the controls and consistently reflect enabled/disabled states in simulation preview and Fit Profile rendering.

# 4. Scope delivered

- Simulation create flow UI + payload wiring for per-day AI evaluation toggles.
- Shared helper for day-key defaults/normalization to remove duplicated day-map logic.
- Simulation detail/preview rendering of AI evaluation on/off state per day.
- Fit Profile behavior for disabled days: no AI score, explicit disabled + human-review messaging.
- Automated test coverage updates for create, detail/preview, and Fit Profile paths.

# 5. What changed

## Create flow

- Added compact AI settings controls in create:
  - `AI Evaluation Settings`
  - Toggle checkboxes for `Day 1` through `Day 5`
- Default state is enabled for all five days.
- Submit payload uses the nested contract shape:

```json
{
  "ai": {
    "evalEnabledByDay": {
      "1": true,
      "2": true,
      "3": true,
      "4": false,
      "5": true
    }
  }
}
```

## Shared AI toggle normalization/helper

- Centralized day-key constants/defaults and normalization/extraction in shared helper logic.
- Reduced scattered `1..5` day-key handling across create and detail normalization paths.
- Ensures missing day keys safely default to enabled while preserving explicit backend-provided boolean values.

## Simulation detail / preview rendering

- Detail normalization reads AI toggle state from backend AI fields and normalizes to a full day map.
- Day cards now render:
  - `AI Evaluation: Enabled`
  - `AI Evaluation: Disabled`
- Disabled days show additional helper text:
  - `Human Review Required`
- Disabled badge uses muted/neutral styling; enabled uses success styling.

## Fit Profile disabled-day behavior

- Disabled AI days do not render an AI score.
- Disabled days render explicit messaging:
  - `AI evaluation disabled for this day.`
  - `Human review required.`
- Disabled placeholder semantics are handled clearly:
  - backend-provided disabled placeholders (`human_review_required` / `ai_eval_disabled_for_day`) are normalized as AI-disabled
  - days in `disabledDayIndexes` are materialized even when missing from `dayScores`

## Tests added/updated

- Create flow integration test now explicitly proves:
  - five day toggles render
  - all toggles default enabled
  - Day 4 can be toggled off
  - submit payload contains exact nested `ai.evalEnabledByDay`
  - flattened/incorrect toggle fields are explicitly rejected in assertions
- Detail/preview tests verify AI enabled/disabled labels and disabled-day human-review messaging.
- Fit Profile tests verify disabled-day placeholder rendering and no AI-score display for disabled days.

# 6. What was intentionally not included

- Simulation edit flow support was intentionally skipped.
- Reason: there is no existing recruiter simulation edit screen/route in this repo (no safe existing edit surface to extend without introducing new product scope).

# 7. Backend contract confirmed

- `ai.evalEnabledByDay`
  - Create submit contract is nested under `ai`.
  - Per-day booleans are carried as string day keys (`"1"`..`"5"`).
- Detail payload AI fields
  - Detail normalization reads AI toggle map from backend AI payload fields (`ai.evalEnabledByDay` with snake_case fallback) and normalizes to full 5-day state.
- Fit Profile disabled-day placeholder semantics
  - Disabled-day state is derived from backend disabled signals (`disabledDayIndexes` and disabled placeholder status/reason semantics), then rendered as human-review-only days.

# 8. Acceptance criteria coverage

- Recruiter can toggle per-day AI evaluation on create.
  - Covered by create integration test (`SimulationCreatePage`) asserting all five toggles, default-on state, and Day 4 disable interaction.
- Toggled values saved and visible on detail fetch.
  - Covered by create payload assertion for nested `ai.evalEnabledByDay` and detail normalization/rendering tests consuming backend detail payload.
- Preview page reflects toggle states.
  - Covered by simulation detail integration tests asserting `AI Evaluation: Disabled`/`Enabled` and `Human Review Required` copy.
- Fit Profile clearly indicates disabled days.
  - Covered by Fit Profile integration/component tests asserting disabled badges and required disabled-day copy.
- Disabled days do not show AI-generated score.
  - Covered by Fit Profile normalization/component/integration tests asserting disabled-day cards render without AI score output.

# 9. Testing

Exact commands run in validated iterations:

```bash
npm test -- --runInBand tests/unit/features/recruiter/simulations/create/createFormConfig.test.ts tests/unit/lib/recruiterApi.test.ts tests/unit/features/recruiter/simulation-detail/RecruiterSimulationDetailPage.helpers.test.ts tests/unit/features/recruiter/fit-profile/FitProfileComponents.test.tsx tests/unit/features/recruiter/fit-profile/fitProfileApi.test.ts tests/integration/recruiter/simulations/new/CreateSimulationContent.test.tsx tests/integration/recruiter/simulations/tests/SimulationDetailContent.test.tsx tests/integration/recruiter/simulations/candidates/FitProfilePage.test.tsx
npm run lint
npx prettier --write src/features/recruiter/api/simulationAiEval.ts src/features/recruiter/simulations/candidates/fitProfile/DayScoreCard.tsx src/features/recruiter/simulations/create/hooks/useSimulationCreateForm.ts src/features/recruiter/simulations/detail/components/PlanDayCard.tsx src/features/recruiter/simulations/detail/hooks/useSimulationLabels.ts tests/integration/recruiter/simulations/tests/SimulationDetailContent.test.tsx
npm run lint
npm run typecheck
npm run build
```

Results:

- Targeted tests: pass.
- `npm run lint`: failed once due to formatting, then passed after running Prettier.
- `npm run typecheck`: pass.
- `npm run build`: pass.
- Overall outcome: lint/typecheck/build/tests all passing.

# 10. Manual QA / Runtime Verification

Manual QA was completed against real localhost frontend + backend runtime using Playwright runtime automation, the playbook-approved local auth harness (`__session` cookie + local JWKS), and direct UI verification with evidence capture under `.qa/issue146/...`.

Manual QA verdict: **PASS**  
Ready for PR raise: **Yes**

Evidence bundle:

- `.qa/issue146/manual_qa_20260313_115354`
- Pointer file: `.qa/issue146/LATEST_EVIDENCE_PATH.txt`

Verified scenarios:

- [x] Create page shows `AI Evaluation Settings` with `Day 1`..`Day 5` toggles
- [x] All five toggles default enabled
- [x] Day 4 can be disabled in the create UI
- [x] Create request payload uses exact nested `ai.evalEnabledByDay` shape
- [x] Simulation detail/preview shows `AI Evaluation: Disabled`, `Human Review Required`, and enabled state on other days
- [x] Fit Profile Day 4 shows `AI Evaluation: Disabled`, `AI evaluation disabled for this day.`, and `Human review required.`
- [x] Disabled Fit Profile day does not show AI score
- [x] Final happy-path QA run had no console errors and no failing API responses

Payload proof captured during manual QA (verbatim):

```json
"ai": {
  "noticeVersion": "mvp1",
  "evalEnabledByDay": {
    "1": true,
    "2": true,
    "3": true,
    "4": false,
    "5": true
  }
}
```

Key QA artifacts:

- `screenshots/01_create_form_default_state.png`
- `screenshots/02_create_form_day4_disabled.png`
- `screenshots/03_detail_preview_ai_states.png`
- `screenshots/04_fit_profile_disabled_day.png`
- `artifacts/create_request_payload.json`
- `artifacts/create_response.json`
- `artifacts/issue146_qa_result.json`
- `QA_REPORT.md`
- `commands.log`

Manual QA scope notes:

- Manual QA used real localhost runtime.
- Validation included UI screenshots, network payload capture, and Fit Profile runtime verification.
- Edit flow remained intentionally out of scope.
- Candidate-facing messaging was backend-exposed but not a separate frontend edit surface in this issue.

# 11. Risks / follow-ups

- Backend disabled-day semantics assumption:
  - UI behavior currently assumes disabled-day markers continue to use current backend disabled signals (`disabledDayIndexes` and disabled placeholder status/reason semantics).
  - If backend introduces new disabled reason/status variants, frontend normalization may need an extension.
- Manual QA environment note:
  - Initial localhost QA attempts hit pre-existing local DB schema drift, causing backend `500` responses during create.
  - QA was resolved using a fresh migrated local Postgres DB: `tenon_issue146_qa`.
  - This was an environment/setup issue, not a product-code defect.
  - No product source code was modified during QA; only `.qa/issue146/...` artifacts/harness files were created.

# 12. Rollout / demo notes

1. Create a simulation and disable `Day 4` in AI Evaluation Settings.
2. Open simulation preview/detail and verify Day 4 shows `AI Evaluation: Disabled` with `Human Review Required`.
3. Generate/open Fit Profile and verify Day 4 renders human-review-only messaging with no AI score shown.

**Final status: Ready for PR raise.**
