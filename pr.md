# 1. Title

Restore candidate invite flow UI with email confirmation and copyable invite URL

# 2. Summary

This PR fixes the Talent Partner candidate invite flow on the Trial detail page. The original `#178` bug is restored end to end: Talent Partner users can now invite from an `active_inviting` Trial, capture candidate full name and email, copy the invite URL, resend the invite, and see invite email status in the candidate list.

During live QA, we also uncovered and fixed a downstream candidate scheduling blocker in the same workstream. Scheduling had been failing with `422` because `body.githubUsername` was required but the frontend was not collecting or submitting it. The scheduling flow now treats GitHub username as a first-class required field through draft, validation, confirmation, and submit.

# 3. Problem / Root Cause

- The invite button stayed disabled until Trial activation state handling was corrected for the `active_inviting` phase.
- The invite modal flow was not presenting a truthful confirmation state after delivery, which made the UI overclaim success before persisted candidate status was fully reconciled.
- Evidence Trail links were still leaking into the new invite experience, which conflicted with the new flow.
- Candidate scheduling was missing a required `githubUsername` field in the frontend contract, so confirm and submit could not satisfy the backend payload shape.

# 4. What Changed

- Enabled the invite action for Trials in `active_inviting`.
- Restored the candidate invite modal to capture:
  - full name
  - email
- Added a truthful invite confirmation state with a copyable invite URL.
- Kept the invite URL copyable even when persisted invite delivery status is degraded, while surfacing a clear warning instead of overclaiming success.
- Added invite email status visibility in the candidate list.
- Restored resend invite behavior.
- Removed legacy evidence link exposure from the new invite flow.
- Updated candidate scheduling so `githubUsername` is handled as a required first-class field in:
  - draft state
  - validation
  - confirmation
  - submit API payload

# 5. Scope Note

- This work covers the original frontend bug in `#178`.
- The candidate scheduling fix was discovered during live end-to-end QA and landed in the same frontend workstream.
- Backend code did not need to change for the GitHub username fix; the frontend now satisfies the existing backend contract.

# 6. QA / Verification

## Automated checks

- `npm run lint` - pass
- `npm run typecheck` - pass
- focused candidate scheduling tests - pass
- `bash precommit.sh` - pass
- final repo gates:
  - 489 test suites passed
  - 1477 tests passed
  - build passed

## Live browser proof

- Real Talent Partner account used: `robel.kebede@bison.howard.edu`
- Real Candidate account used: `robiemelaku@gmail.com`
- Browser-based local-stack verification completed
- Final successful proof:
  - Trial ID: `4`
  - CandidateSessionId: `5`
  - Invite URL: `http://localhost:3000/candidate/session/UMgogIFqb11Iacu0UmTREIYjBR-NxVv3iQ_2PHfgSJ0`
  - candidate claim path succeeded
  - scheduling succeeded in browser
  - confirmation showed `GitHub username: octocat`
  - persisted state included:
    - `githubUsername`
    - `scheduledStartAt`
    - `candidateTimezone`
    - `scheduleLockedAt`

# 7. Risks / Follow-Ups

- A transient backend `GITHUB_UNAVAILABLE` occurred on later fresh-invite retries. It did not block the verified successful flow, but it should be treated as a separate reliability concern rather than a blocker for this PR.

# 8. Final Verdict

Ready for PR.
