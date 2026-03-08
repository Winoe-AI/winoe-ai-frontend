# feat(candidate): add structured Day 5 reflection submission flow

## TL;DR

- Added a dedicated Day 5 structured reflection panel instead of using a generic markdown blob.
- Submit payload now aligns with backend #212 contract: `reflection` object plus required `contentText`.
- Added client-side validation and inline backend field-level error mapping for reflection sections.
- Success moves to a submitted terminal state; read-only/day-closed behavior is respected.
- Non-Day-5 documentation tasks still use the existing generic text submission panel.

## What changed

- Introduced `Day5ReflectionPanel` for Day 5 reflection data entry and submission orchestration.
- Enforced the required section set: `challenges`, `decisions`, `tradeoffs`, `communication`, and `next`.
- Added client-side per-section length validation and submit gating until all required sections are valid.
- Added deterministic markdown generation for canonical `contentText` from sectioned reflection inputs.
- Added backend `422` field error mapping to section-level inline errors.
- Added strict Day 5 routing guard: structured panel renders only when task type is `documentation` and `dayIndex === 5`.
- Added terminal submitted/read-only behavior for successful submission.
- Preserved generic documentation behavior for non-Day-5 tasks.

## Backend/API contract

- Endpoint: `POST /api/tasks/{task_id}/submit`
- Request payload includes:
  - `reflection.challenges`
  - `reflection.decisions`
  - `reflection.tradeoffs`
  - `reflection.communication`
  - `reflection.next`
  - `contentText`
- Client-side and backend-aligned minimum length: `20` characters per section.
- Backend validation errors are mapped from `details.fields["reflection.<section>"]` into inline field errors.

## Read-only / replay behavior

- Immediate successful submit shows terminal read-only structured content locally.
- For replay/closed-mode rendering, canonical `contentText` is preferred when embedded finalized submission data exists.
- The candidate `currentTask` backend read path currently returns `TaskPublic` only and does not yet expose finalized Day 5 replay body fields.
- Therefore, in read-only/day-closed mode without embedded replay content, the frontend shows a read-only placeholder rather than inventing missing content.

## Testing

- `npm run lint` — pass
- `npm run typecheck` — pass
- `npm test` — pass

Key behavior coverage:

- Submit is blocked until all required sections are valid.
- Submitted payload shape (including `reflection` and `contentText`) is verified.
- Backend `422` field errors are mapped inline to the correct reflection section.
- Submitted terminal read-only state is verified.
- Day-closed read-only behavior is verified.
- False-positive routing guard is verified (non-Day-5 docs do not render the Day 5 panel).

## Audit QA (manual / local e2e)

### Verdict

- Manual QA verdict: **PASS**
- Recommendation: **Ready for PR**

### Execution environment

- Frontend SHA: `ebf78e8370b3e8f8c4b802b3baf37aad47b16884`
- Backend SHA: `4d7242fa206fe3462793a4f8eb63ed0984e5a9bd`
- OS: `Darwin 25.3.0 arm64`
- Node / npm: `v25.2.1 / 11.6.2`
- Python / Poetry: `3.14.3 / 2.3.2`
- Playwright: `1.57.0`
- Frontend: `http://localhost:3000`
- Backend: `http://127.0.0.1:8000`

### Runtime/auth setup

- Real local frontend and backend servers were started and exercised.
- Local JWKS + JWT harness was used for auth.
- Auth0-style `__session` cookie harness was used for browser auth.
- Candidate sessions were created via real backend APIs.
- Playwright drove browser verification for the scenario pass set.

### Scenario matrix

| Scenario                                                                            | Result | Notes                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. Day 5 structured form render                                                     | PASS   | Structured reflection UI rendered for Day 5 documentation task.                                                                                                                        |
| B. Client-side validation / submit gating                                           | PASS   | Required sections + min-length validation blocked submit until valid.                                                                                                                  |
| C. Successful submit terminal/read-only state with actual submitted content visible | PASS   | Corrected pass confirmed submit `201`, read-only submitted state appeared, no editable controls remained, actual submitted text was visible, and `Loading preview...` was not present. |
| D. Backend validation error inline mapping                                          | PASS   | Backend `422` field errors mapped inline to the matching section.                                                                                                                      |
| E. Day closed / read-only behavior                                                  | PASS   | Day-closed state rendered read-only behavior as expected.                                                                                                                              |
| F. Non-Day-5 documentation regression guard                                         | PASS   | Non-Day-5 documentation task continued to use generic text panel.                                                                                                                      |

### Evidence files

- `.qa/issue142/manual_qa_20260308_112031_correction/QA_REPORT.md`
- `.qa/issue142/manual_qa_20260308_112031_correction/screenshots/05_C_before_submit.png`
- `.qa/issue142/manual_qa_20260308_112031_correction/screenshots/06_C_after_submit_read_only_content_visible.png`
- `.qa/issue142/manual_qa_20260308_112031_correction/screenshots/07_E_day_closed_read_only.png`
- `.qa/issue142/manual_qa_20260308_112031_correction/screenshots/08_F_non_day5_generic_text.png`
- `.qa/issue142/manual_qa_20260308_112031_correction/artifacts/scenario_c_correction_result.json`
- `.qa/issue142/manual_qa_20260308_112031_correction/artifacts/sanitization_checks.txt`
- `.qa/issue142/manual_qa_20260308_112031_correction/artifacts/zip_sanitization_checks.txt`
- `.qa/issue142/manual_qa_20260308_112031_correction.zip`

### Notes / limitations

- The corrected QA bundle is the authoritative final QA source for this PR.
- Scenario C was re-verified in the correction pass to prove actual submitted content visibility in read-only state.
- A/B/D/E/F evidence was carried forward from the earlier same-day run into the corrected bundle for continuity.
- Sensitive JWT, invite, and private-key material was redacted/removed before final packaging.

## Screenshots / UI evidence

No manual screenshots were captured in this iteration; UI behavior is covered by unit/integration tests in this PR.

## Risks / rollout notes

- Candidate replay body fields are not yet returned on the current backend `currentTask` candidate read path.
- Richer closed-mode replay rendering can be expanded once backend exposes explicit finalized reflection content.
- Autosave integration remains follow-up work under #137 and was not expanded here beyond compatibility seams.

## Reviewer notes

1. Verify a Day 5 task renders the structured reflection form.
2. Verify a non-Day-5 documentation task still renders the generic text area.
3. Verify backend `422` reflection field errors appear inline on the matching section.
4. Verify successful submission transitions to read-only submitted state.
