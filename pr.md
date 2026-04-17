## 1. Title

Trial creation polish for #176: role title/description split and v4 from-scratch pivot alignment

## 2. Summary

This PR sharpens the Trial creation flow for the Talent Partner path and aligns the create experience with the v4 from-scratch pivot.

## 3. What changed

- Split the create form into separate `Role title` and `Role description` inputs.
- Kept `Advanced Settings` collapsed by default.
- Auto-opens `Advanced Settings` when advanced-field validation errors are present.
- Added an optional `Preferred language/framework` field for scenario-generation context.
- Included the exact helper text:
  - `This is optional and helps Winoe generate a relevant project brief. The candidate may ultimately use any language or framework they choose.`
- Added clearer loading-state behavior while the Trial is being generated.
- Redirects to the Trial detail page after a successful create.
- Removed the retired template/stack selector path from the active create flow.
- Aligned the create payload cleanup with the v4 pivot so the frontend no longer sends legacy template or stack fields.

## 4. Backend alignment

- Live end-to-end Trial creation was initially blocked by a backend Trial-create contract mismatch.
- That backend blocker was resolved separately.
- Trial creation was rerun successfully after backend alignment.

## 5. QA / verification

- `npm run lint` - pass
- `npm run typecheck` - pass
- `npm test -- --runInBand` - pass
- precommit checks - pass
- Focused create-flow tests - pass
- Live local stack verification - pass
- Real Trial creation returned success and redirected to the Trial detail page
- Key live evidence:
  - create request succeeded with `201`
  - request used the pivoted payload
  - legacy client `techStack` / `templateKey` were omitted
  - redirect to `/dashboard/trials/{id}` succeeded

## 6. Scope / non-scope

- No rollback to legacy template-selector behavior.
- No reintroduction of template or tech stack selector UI.
- No unrelated product refactors.

## 7. Risks / follow-ups

- The contract-live auth bootstrap helper may still be stale and could use a cleanup pass later, but it is not a blocker for this PR.
