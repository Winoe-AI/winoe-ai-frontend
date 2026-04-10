# Contract-Live Lane

This lane is for real-stack validation only.

- It targets the real local app on `http://localhost:3000` by default so the browser host matches the app's Auth0 callback configuration.
- It creates fresh talent_partner and candidate browser sessions through the real Auth0 login flow during Playwright global setup.
- It must not add mocked API routes.
- It writes timestamped evidence bundles under `winoe-frontend/qa_verifications/Contract-Live-QA/contract_live_qa_latest/artifacts/<timestamp>/`.

Required auth env vars:

- `QA_E2E_TALENT_PARTNER_EMAIL`
- `QA_E2E_TALENT_PARTNER_PASSWORD`
- `QA_E2E_CANDIDATE_EMAIL`
- `QA_E2E_CANDIDATE_PASSWORD`

The lane reads those from the current shell first, then falls back to `winoe-frontend/.env.local`, `../Winoe-Envs/.env.local`, and `../Winoe-Envs/.env` when present.

Use `winoe-frontend/qa_verifications/Contract-Live-QA/run_contract_live.sh` to create the evidence directory under `contract_live_qa_latest/artifacts`, update `contract_live_qa_report.md`, build the real auth storage states, run the Playwright access checks, and then execute one or more `live_flow_driver.mjs` commands inside the same evidence bundle.
By default it runs `talent_partner-fresh`, which proves more than auth/access smoke by creating a fresh trial and issuing a real invite.
Set `CONTRACT_LIVE_DRIVER_SEQUENCE` to a comma-separated list such as `talent_partner-fresh,candidate-schedule,candidate-day` or `candidate-day,talent_partner-review` to advance later phases of the same proof.
Use `CONTRACT_LIVE_SKIP_DRIVER=1` only when you intentionally want auth/bootstrap without the live driver.

Use `winoe-frontend/qa_verifications/Contract-Live-QA/run_contract_live_stack.sh` to boot the real frontend, backend, and worker under a shared test clock while capturing stack logs into the same evidence bundle.
Set `CONTRACT_LIVE_STACK_LABEL` when restarting the stack across Day 1 through Day 5 so each phase keeps distinct `backend-<label>.log`, `worker-<label>.log`, and `frontend-<label>.log` evidence instead of overwriting prior phases.

This lane is the authoritative Playwright entrypoint for live-stack proof work. `tests/e2e/flow-qa` remains mocked UI regression coverage only.
