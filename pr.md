## Summary

- Reflected the v4 from-scratch pivot in the trial creation flow by removing the template catalog UI and tech stack selector.
- Replaced those retired selectors with an optional free-text `Preferred Language/Framework` input.
- Updated trial detail and preview views to stop rendering retired template/stack metadata and to show `Project Brief` instead of `Codespace Structure`.
- Discarded retired template catalog fields in the frontend so legacy metadata is no longer surfaced in active UI.

## Issue

Closes #197

## What changed

### Trial creation

- Removed the template repository selector from the trial creation form.
- Removed the tech stack selector tied to the template catalog.
- Added an optional `Preferred Language/Framework` text input for free-form stack guidance.
- Kept the helper copy exactly aligned with the v4 brief guidance: `Optional. Helps Winoe generate a relevant project brief. Candidates may use any stack.`

### Trial detail / preview

- Removed template name, template key, repository, and tech stack metadata from the detail and preview UI.
- Renamed the section from `Codespace Structure` to `Project Brief`.
- Ensured retired catalog terminology is no longer rendered in the active detail/preview experience.

### Regression coverage

- Confirmed no active source imports of `templateCatalog` remain.
- Verified the source grep for `templateCatalog`, `template_repository`, and `tech_stack` returns zero active UI hits.
- Kept the change scoped to the frontend so it tolerates the backend contract transition while the API pivot continues.

## Validation

- [x] `npm run lint`
- [x] `npm test -- --runInBand`
- [x] Strict source grep for template catalog / template repository / tech stack fields returned zero active source hits
- [x] Manual local QA with backend + frontend running
- [x] Trial creation page verified in browser
- [x] Trial detail / preview page verified in browser

## Manual QA

Environment:
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:3000`
- Browser: Chromium via Playwright
- Account: Talent Partner

Verified:
- Trial creation does not show Template Repository selector
- Trial creation does not show Tech Stack selector
- Trial creation shows `Preferred Language/Framework` as free text
- Helper text exactly matches: `Optional. Helps Winoe generate a relevant project brief. Candidates may use any stack.`
- Trial detail / preview shows `Project Brief`
- Trial detail / preview does not show template name/key/repository or tech stack metadata
- No retired terminology visible on the checked pages

Screenshots:
- `qa_verifications/issue197-trial-create.png`
- `qa_verifications/issue197-trial-detail.png`

## Notes / risks

- Backend #302 may still return retired fields during contract transition; frontend now discards them before rendering.
- Remaining broad grep hits are limited to tests, fixtures, historical docs, or generated session artifacts, not active UI source.
