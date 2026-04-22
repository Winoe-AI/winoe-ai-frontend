# Phase 3 frontend ship set

## Summary

This frontend PR supports the Phase 3 verification flow for the Talent Partner golden path.

It is verification support, not product UX work.

The change set covers:

- the contract-live browser harness,
- the contract-live stack runner,
- a debug auth evidence route,
- the invite proxy route,
- and the corresponding live/unit tests.

## Why

Phase 3 needed a repeatable live-stack proof path that could:

- validate storage state before browser execution,
- capture candidate scheduling proof including GitHub username handling,
- verify termination and post-termination behavior,
- and expose enough auth evidence to support the verification report.

## Implementation Notes

### Live QA harness

- `live_flow_driver.mjs` now fails fast when the expected storage-state file is missing.
- Navigation and load handling were tightened to rely on `domcontentloaded` instead of overusing network-idle assumptions.
- Candidate scheduling proof capture now records the GitHub username field and persisted schedule state.
- The harness explicitly checks that an empty GitHub username blocks continue, then fills a valid value and verifies the confirmed state includes it.
- Termination flow coverage was added so the live QA run can capture cleanup and post-termination evidence.

### Stack runner

- `run_contract_live_stack.sh` now wires explicit scenario-generation environment values into the live verification stack.
- The runner can reuse `gh auth token` when available so the harness can execute with the operator's existing GitHub auth context.

### API routes

- The debug auth evidence route now returns `email` and `emailVerified` in addition to the existing user metadata.
- The trial invite route now forwards the request with a 90 second timeout, which matches the live invite/bootstrap path budget.

### Tests

- Contract-live E2E coverage was updated to use the more reliable load handling.
- Unit tests were updated for the debug auth route and invite route behavior.

## Test / Verification

- Updated contract-live and unit tests cover the verification-specific route and harness changes.
- The live QA harness itself was exercised against the real local stack as part of the Phase 3 verification work.

## Risks / Limitations

- The harness is verification support, not end-user product UX.
- Cleanup/job anomaly remains documented in evidence, not hidden.
- This PR does not change candidate auth policy.
- The route timeout change improves the live invite path, but it does not guarantee upstream GitHub latency will never exceed the budget.
