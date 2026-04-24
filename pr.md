# 1. Title

Fix Candidate Portal Trial listing, progress, and status for the 5-day Trial model

# 2. Problem

Issue #180 was caused by two user-facing defects in the candidate dashboard:

- progress was rendered as `X/10` and 50% even though the product now uses a 5-day Trial model
- the invite list included Trials that did not belong to the signed-in candidate

The dashboard also needed a cleaner state model so the UI could show the right candidate-facing states without treating every presentation state as a persisted session status.

# 3. What Changed

- The candidate dashboard invite list now uses the terminated-aware contract path:
  - `/candidate/invites?includeTerminated=true`
- Progress is normalized and rendered against a fixed 5-day model, so the dashboard now shows `X/5`.
- Invite isolation is enforced so the signed-in candidate only sees Trials they were actually invited to.
- Each Trial card now renders the required fields:
  - title
  - company
  - Talent Partner name
  - current day
  - status
- Candidate-facing state rendering now covers the full Trial lifecycle:
  - invited
  - awaiting start date
  - scheduled
  - Day N open
  - Day N closed
  - complete
  - report ready
  - terminated
- Completed Trials route to review.
- Report-ready Trials also route to review.
- Terminated Trials remain non-active and non-resumable.
- Tests were updated for:
  - state derivation
  - navigation
  - rendering
  - candidate invite API behavior

# 4. Contract / State Model

The final contract keeps the persisted session lifecycle canonical:

- `CandidateSession.status` remains the source of truth for the canonical session lifecycle
- `report ready` and `terminated` are invite-facing derived states, not literal persisted candidate-session statuses

Those invite-facing states are represented through explicit fields on the invite payload, including:

- `reportReady`
- `hasReport`
- `terminatedAt`
- `isTerminated`

The dashboard consumes those fields to derive the correct UI state while leaving the canonical session status model intact.

# 5. Why This Is Correct

This fixes the original bug and aligns the UI with the actual product model:

- the progress display now matches the 5-day Trial flow
- invite rows are filtered to the real candidate scope, so cross-contaminated rows do not appear
- the UI can represent richer invite-facing states without widening the persisted session enum
- review routing is correct for both `complete` and `report ready`
- termination is treated as a terminal, non-resumable state

The result is a cleaner separation between canonical session state and dashboard presentation state.

# 6. Validation / QA

Real end-to-end QA passed with:

- the frontend and backend stack running locally
- an authenticated browser session
- seeded candidate data
- the actual dashboard request path verified
- the browser-session BFF payload matching the backend payload content
- live browser verification of:
  - invited
  - awaiting start date
  - scheduled
  - Day N open
  - Day N closed
  - complete
  - report ready
  - terminated
- completed and report-ready review routing verified
- terminated non-resumable behavior verified
- the control candidate row did not appear

# 7. Risks / Follow-Ups

- Any future invite fixture should continue to treat `CandidateSession.status` as canonical and use the explicit invite fields for derived report-ready and termination behavior.
- If additional Trial lifecycle states are introduced later, they should be added as invite-facing derivations rather than by expanding the persisted session status model unless the product contract explicitly requires that change.

# 8. Final Result

The candidate dashboard now reflects the 5-day Trial model correctly:

- progress is shown as `X/5`
- only the signed-in candidate's invited Trials appear
- Trial cards show the expected metadata and status
- completed and report-ready Trials route to review
- terminated Trials are shown as terminal and cannot be resumed

Worker Report:
- Summary
  - Updated `pr.md` only to describe the completed fix for issue #180 and the final QA-passed contract/state model.
- Files changed
  - `pr.md`
- Commands run
  - `pwd` and `rg --files -g 'pr.md' -g 'PR.md' -g 'Issue.md' -g 'issue.md'` - pass
  - `git status --short` - pass
  - `sed -n '1,240p' pr.md` - pass
  - `sed -n '1,260p' issue.md` - pass
- Risks / assumptions
  - Assumed the existing implementation and QA are final and only the PR write-up needed updating.
  - Kept `CandidateSession.status` described as canonical and treated `report ready` / `terminated` as derived invite states only.
- Open questions / blockers
  - None
