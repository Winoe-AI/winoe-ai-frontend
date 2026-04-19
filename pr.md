## 1. Title

Restore Trial detail preview for the v4 project brief flow

## 2. Summary

This PR restores the Talent Partner Trial detail page and aligns it to the v4 from-scratch pivot. The Trial preview now shows the Project Brief, scenario storyline, task descriptions, rubric summary, scenario version, and frozen AI snapshot metadata.

## 3. What changed

- Rebuilt the Trial detail preview so it renders the full scenario experience again after the backend contract fixes.
- Replaced legacy codespace/template framing with Project Brief language throughout the active Trial detail UI.
- Removed template name, template repo, and tech stack from the active Trial detail surface.
- Kept preferred language/framework visible only as informational context when present.
- Aligned the 5-day labels to the product spec:
  - Planning and Design Doc
  - Implementation Kickoff
  - Implementation Wrap-Up
  - Handoff + Demo
  - Reflection Essay
- Restored lifecycle controls for approve, activate, and terminate flows.
- Restored the generation failure state with a clear message and retry action.
- Kept invite controls disabled until the Trial reaches active inviting.

## 4. Backend alignment

- Backend normalization and retry blockers were resolved enough to complete full real-stack QA on the Trial detail experience.
- Live validation used the running frontend and backend, not mocked data.

## 5. QA / verification

- `npm run lint` - pass
- `npm run typecheck` - pass
- Live browser QA on the local stack - pass
- Trial 67 verified approve, activate, invite gating, and terminate behavior
- Trial 49 verified the failure state, retry flow, and Project Brief preview
- Verified outcomes:
  - scenario storyline loaded
  - task descriptions loaded
  - rubric summary loaded
  - scenario version and frozen AI snapshot metadata were visible
  - invite controls stayed disabled until activation
  - Project Brief replaced legacy codespace/template framing
  - no template name, template repo, or tech stack appeared in the active Trial detail UI
  - `codespace structure` does not appear in the restored Trial detail surface

## 6. Scope / non-scope

- No reintroduction of legacy template-selection UI.
- No claim of backend permanence beyond the live QA proof captured here.
