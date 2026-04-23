# 1. Title

Candidate invite claim now shows specific invalid, expired, already-claimed, and access-denied states

## 2. Problem

Candidate invite flows were collapsing too many backend outcomes into a generic unavailable-state experience. That made it hard to tell the difference between a malformed token, an expired invite, an already-claimed session, and a real access problem.

The old candidate sign-in copy also implied a verification workflow that the product does not own. Auth0 owns email verification, so the frontend should only guide candidates through sign-in, invite-email matching, session ownership, and invite lifecycle errors.

## 3. What Changed

- Invite token resolution now maps backend responses to distinct candidate states:
  - `400` and `404` become an invalid invite response.
  - `409` becomes an already-claimed invite response, and a recoverable bootstrap payload is treated as a live session.
  - `410` becomes an expired invite response.
  - `403` now resolves to access-denied or sign-in guidance instead of verification-flavored copy.
- Candidate invite error rendering now shows distinct titles and messages for invalid, expired, and already-claimed cases.
- The candidate error view now sends already-claimed unauthenticated users to sign in, while keeping the home/retry actions for the other invite states.
- Candidate login copy now says to sign in with the email tied to the invite.
- Shared invite copy now has separate messages for invalid, expired, already-claimed, and generic unavailable states.
- Unit coverage was expanded for:
  - invite token resolution and 409 recovery
  - candidate bootstrap error mapping
  - candidate session error routing
  - invite error message helpers
  - candidate login copy
  - the legacy `/candidate-sessions/[token]` redirect path

## 4. Why This Is Correct

The candidate runtime now matches the intended contract:

- sign-in state
- invite email match
- session ownership
- already-claimed handling
- invalid and expired invite handling

There is no shipped frontend email-verification workflow here because Auth0 owns that concern. The frontend should only surface the invite/session state that the backend returns.

Treating a recoverable `409` payload as the active session is correct because it represents an already-claimed invite that can continue instead of a dead-end error.

## 5. Validation / QA

- Updated unit tests cover the new invite-status mapping and error-copy paths.
- Route coverage now includes the legacy redirect-only `/candidate-sessions/[token]` behavior.
- The candidate login page behavior test now verifies the invite-email sign-in subtitle.

## 6. Risks / Follow-Ups

- Issue `#179` still mentions unverified-email verification instructions. That wording is stale relative to the actual product contract and should not be treated as shipped candidate behavior.
- The already-claimed recovery path depends on the backend returning a recoverable bootstrap payload for `409`; otherwise the user sees already-claimed guidance.
- If backend invite error shapes drift, the status-to-copy mapping will need to be kept in sync.

## 7. Final Result

The frontend candidate invite flow now gives candidates clear, specific recovery paths for invalid, expired, already-claimed, and access-denied invite states, without introducing a frontend-owned email-verification flow.
