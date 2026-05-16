# Task 5 (Iteration 2): Trial Preview, Approval, Detail, and Candidate Invite

## Summary

- **Trial Preview** at `/talent-partner/trials/{id}/preview`: Project Brief from **`readProjectBrief` / `detail.projectBrief`** (canonical markdown), not the scenario label; honest fallback when only storyline-like content exists. Rubric table, cadence, sticky actions (approve, regenerate, discard, print).
- **Trial Detail** tabs: **Brief** uses **`selectedScenarioVersion.projectBriefMd`** (version snapshot), not `scenarioLabel`. **MarkdownRenderer** uses design-token-friendly defaults where adjusted (e.g. `pre` surface).
- **Batch invite** modal: token-oriented styling, **`fieldset` / `legend`**, row-scoped labels (**`Full name (row n)`**, **`Email (row n)`**), duplicate validation, **`aria-live`** summary, success UI lists **sent** and **failed** rows with per-row errors; invite URLs copyable with accessible controls.
- **BFF**: Next routes under `src/app/api/trials/[id]/approve` and `invite-candidates` forward to the backend; clients use **`requestTalentPartnerBff`** with **`/trials/{id}/approve`** and **`/trials/{id}/invite-candidates`** (same convention as other trial BFF calls — not `/backend/trials/...`).

## Preview / Detail data sources

| Surface            | Project Brief source                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| Preview            | `detail.projectBrief` from normalized trial detail / `readProjectBrief()`; not scenario display label |
| Detail → Brief tab | Active / selected scenario snapshot **`projectBriefMd`**                                              |

Scenario label / version string is **not** used as a stand-in for the Project Brief.

## BFF / API route paths

- **`approveTrialForInviting`**: `POST` **`/trials/{id}/approve`** via `requestTalentPartnerBff`.
- **`inviteCandidatesBatch`**: `POST` **`/trials/{id}/invite-candidates`** via `requestTalentPartnerBff`.
- Unit tests assert these URL paths (see `trialLifecycle.test.ts`, `invitesBatchApi.test.ts`).

## Invite modal behavior

- Duplicate emails in the form: user-visible errors; row-specific **`id` / `htmlFor`** wiring for multiple rows.
- API partial success: **`status: 'failed'`** rows show **`errorCode` / `errorMessage`**; **`useInviteBatchCandidateFlow`** (and related copy) treats mixed sent/failed outcomes explicitly.

## Regenerate / discard

- **Regenerate**: on success, navigates to **`/talent-partner/trials/{id}`** with **`router.refresh`** so the Talent Partner lands on the **Task 4-style trial detail / generation** experience instead of a stale preview-only reload.
- **Discard draft**: calls **`terminateTrial`**; modal copy describes **termination** (draft ends in **terminated** state), not a misleading “hard delete” promise if the backend archives/terminates rather than destroying rows.

## Components / files (non-exhaustive)

- `src/shared/ui/MarkdownRenderer.tsx`
- `src/features/talent-partner/trial-management/preview/TrialPreviewContent.tsx`
- `src/features/talent-partner/trial-management/detail/components/TrialDetailTabs.tsx`
- `src/features/talent-partner/trial-management/invitations/InviteCandidatesBatchModal.tsx`, `InviteInputField.tsx`
- `src/features/talent-partner/api/trialLifecycle.actions.approveApi.ts`, `invitesBatchApi.ts`
- `src/app/api/trials/[id]/approve/route.ts`, `invite-candidates/route.ts`

## Tests run

```bash
npm run lint
npm run typecheck
npm test -- --runInBand
```

**Pass** (Iteration 2): **517** test suites, **1640** tests; Prettier + ESLint clean.

## Iteration 5 — Manual QA blocker fixes (May 2026)

- **Trial Detail (active inviting)**: **Regenerate** moved into the **overflow menu** (with Edit details / Terminate); primary header actions stay **Invite candidates** + **More**. **Scenario workbench** is tucked under **“Advanced — scenario workbench”** `<details>` so tabs + Candidates stay the default surface.
- **Lock copy**: Scenario lock messaging no longer claims “invites exist” by default; it states the version is locked because the **Trial is approved for inviting**.
- **Preview approve UX**: **`SCENARIO_APPROVAL_PENDING`** surfaces as a **warning**-tone notification (not a generic error-only toast).
- **Action error sanitization**: `mapActionError` strips UI-facing strings that include **`api.github.com`** or **`GitHub API error`** before falling back to a safe message.
- **Print brief as PDF**: Existing unit test continues to assert **`window.print`** via the **Print brief as PDF** button; print CSS still hides **`.tp-no-print`** chrome.

### Manual QA rerun (this iteration)

- **Not claimed as pass**: Full browser manual QA was **not** re-run end-to-end in this agent session after these changes.
- **`./precommit.sh`** remains the automated gate for this branch.

## Known limitations

- If the backend regeneration endpoint does not fully mirror Task 4’s streaming/progress contract, the UI still relies on **detail refresh + trial route** for progress; any gap is owned by backend/Task 4 alignment.
- **Activity** tab has no dedicated audit API yet; it summarizes **scenario approval/lock** and **invite-related candidate row signals** (invite URL / sent timestamp) from existing detail data.
- No browser QA or screenshots in this pass.

## Iteration 7 (May 2026)

- **Prettier**: `InviteCandidatesBatchModal` + batch modal tests formatted; `./precommit.sh` green.
- **Activity tab**: `TrialDetailTabs` shows short bullets when the scenario is **approved/locked** or **ready for review**, and when candidates have **invite URLs** or **invite email sent** timestamps; otherwise the previous empty-state copy remains.
- **Tests**: `TrialDetailTabs.brief.test.tsx` extended with Activity coverage.
- **Manual QA**: Full invite/GitHub tree pass **not re-run** in this session; follow backend `pr.md` Iteration 7 for log/tree verification steps.

## Iteration 9 (May 2026)

- **No frontend code changes** for this iteration; behavior depends on backend fixes in **`winoe-ai-backend` `pr.md` → Iteration 9** (Anthropic scenario generation request ordering + richer error classification; invite email persistence uses **`flush`** so batch + Codespace finalization share one coherent transaction boundary per row).
- **Manual QA**: Full two-candidate + real LLM path **not re-run** in this agent session (no provider keys in the environment). Re-run the supervisor checklist once backend is deployed with keys.

## Iteration 11 (May 2026) — Stabilization (precommit, BFF, seed, generation UI)

### Root causes fixed

- **Backend coverage gate**: Total coverage was fractionally under **96%** while rounding to `96.00%`. Added **approve lifecycle unit tests**, **Anthropic `call_anthropic_json` contract tests**, and **batch invite / provisioning** tests so the gate clears without lowering `cov-fail-under`.
- **Next BFF 500 on `/api/trials`**: `forwardJson` always called **`getSessionNormalized()`** after BFF auth succeeded; in local/dev that call can **throw** (Auth0/session edge cases), turning good upstream calls into **500**. Session lookup is now **best-effort** inside a `try`/`catch`; **`x-dev-user-email`** is omitted when lookup fails instead of failing the proxy.
- **Scenario generation model / env drift**: Repo **`.env`** still pinned **`WINOE_SCENARIO_GENERATION_MODEL=claude-opus-4-7`** while defaults moved to **`claude-3-5-sonnet-20241022`** (Anthropic Messages API–friendly). **`.env`**, **`runBackend.sh` default**, and **`SettingsFields`** are aligned so local runs and tests resolve the same model.
- **`scenario_generation_llm_failed` grepability**: Added a second plain-text log line **`scenario_generation_llm_failed_message errorSummary=…`** after the structured warning so aggregators that drop `extra=` still surface **`errorSummary=`** for classification.
- **Local QA seed**: **`scripts/local_qa_backend.sh`** now runs **`poetry run python scripts/seed_local_talent_partners.py`** after migrations (idempotent; **`WINOE_LOCAL_QA_SKIP_SEED=1`** to skip). Shell test documents **`WINOE_LOCAL_QA_SKIP_SEED`** alongside the alembic skip guard.
- **Generation wizard stuck on “Drafting”**: While SSE remains primary, the wizard now **polls `GET /api/trials/{id}`** for **`generationStatus === 'failed'`** (and **`ready_for_review`**) so a missed **`failed`** SSE frame does not leave the UI spinning forever. Failed state adds **Back to Trials** next to **Edit context** / **Try again**.

### Files changed (representative)

- `src/platform/server/bff/forward.ts` — resilient Auth0 session read for dev email header.
- `src/features/talent-partner/trial-management/create/NewTrialWizard.tsx` — detail polling + return control.
- `tests/trials/services/test_trials_lifecycle_approve_service_unit.py`, `tests/ai/test_ai_provider_clients_call_anthropic_json_contract.py`, `tests/trials/services/test_trials_invite_batch_service.py`, `tests/scripts/test_local_qa_backend_shell.py` — coverage and script guards.

### Commands run (this session)

- **`cd winoe-ai-backend && ./precommit.sh`**: **PASS** (after fixes).
- **`cd winoe-ai-frontend && ./precommit.sh`**: **PASS**.

### Anthropic / job `aba0f408-d6ea-4f7c-89f6-295a90001482`

- **No server log artifact** was present in this workspace for that job id; classification from stored logs was **not possible** here. With the new **`scenario_generation_llm_failed_message errorSummary=`** line and aligned model default, re-run generation and grep worker output for **`anthropic_request_failed:`** + **`tool_attempt=`** / **`json_prompt_attempt=`** to classify (**invalid model** vs **payload/schema** vs **account/entitlement** vs **429**/outage).

### Known limitations

- **Full narrow live smoke** (backend + Next + curl BFF) was **not** executed in this session (no long-running servers started). **Recommendation**: run the supervisor’s narrow smoke checklist on a dev machine with DB + keys before full Task 5 manual QA.
- **Not CODE READY** note **superseded** by **Final Task 5 QA Signoff — CODE READY** (post–Iteration 12) below.

## Final Task 5 QA Signoff — CODE READY

### Status

**CODE READY — proceed to final handoff / PR packaging.**

The frontend passed the Task 5 Talent Partner flow in live manual QA after Iteration 12. **Task 5 is CODE READY despite the Anthropic billing caveat** below — the UI path was fully verified in demo mode after real generation failed only for provider account/credits, not for frontend implementation defects.

### Final verification summary

- Frontend `./precommit.sh`: PASS
- Backend `./precommit.sh`: PASS
- `/api/dev/qa-login`: PASS
- BFF `GET /api/trials`: PASS
- BFF `POST /api/v1/trials`: PASS
- BFF `GET /api/trials/{id}`: PASS
- Trial Preview rendered correctly: PASS
- Approve through UI: PASS
- Active Trial Detail rendered correctly: PASS
- Two-candidate invite modal: PASS
- Invite URLs visible/copyable: PASS
- Candidate rows refreshed: PASS
- Repo tree proof passed for both candidates: PASS
- README proof passed for both candidates: PASS
- Termination UI: PASS
- No raw provider errors in the final successful Talent Partner UI path: PASS

### Preview / approval

Verified on Trial ID `3`.

The Preview page showed:

- Tags row
- Actual Project Brief
- Rubric table
- Daily cadence pills
- Sticky decision panel
- Print path
- Approval flow

Approval worked through the Talent Partner UI and moved the Trial to active detail.

### Active Trial Detail

Verified:

- Hero/title
- Role context
- Active badge
- Invite candidates button
- Overflow menu
- Tabs: Candidates / Brief / Rubric / Activity
- Scenario workbench behind Advanced
- Brief tab showing approved Project Brief
- Rubric tab showing approved rubric

### Candidate invite UI

Verified candidate emails:

```txt
task5-final-a+1778782430@example.com
task5-final-b+1778782430@example.com
```

Both invites returned as sent with visible/copyable invite URLs.

The UI correctly represented workspace setup as needing attention because Codespace provisioning failed externally, while repo bootstrap succeeded.

No raw provider errors were visible in the final successful Talent Partner UI path.

### Termination UI

Verified:

- Neutral termination copy.
- Checkbox confirmation.
- Trial terminated state.
- Invite/resend/copy actions disabled.
- Cleanup-in-progress messaging with job id.
- No raw provider errors.

### Real LLM caveat

Real LLM generation was attempted before demo-mode QA. Anthropic returned a billing/credit error:

```txt
credit balance too low
```

Classification:

```txt
quota / billing / insufficient Anthropic credits
```

The full Task 5 UI/invite/repo/termination QA was completed using demo mode after this provider-account failure. This is acceptable for Task 5 signoff because the frontend flow itself passed and the real-generation failure is not a frontend implementation blocker.

### Operational note

During QA, local DB Alembic drift caused invite failures before the schema was corrected. After the DB was brought to the true repo head and migration `202605120001` was actually applied, the invite flow passed.

Optional follow-up:

- Ensure local QA setup detects schema drift before the Talent Partner invite flow.
- Continue sanitizing backend-originated ORM/SQL failures defensively, even though the correct fix is migration hygiene.
