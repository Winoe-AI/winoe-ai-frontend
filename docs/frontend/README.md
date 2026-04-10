# Frontend Documentation Index

This directory is the frontend code-truth documentation set for `winoe-frontend`.

## Scope

- Reflects implementation in `src/app`, `src/features`, `src/platform`, and `src/shared`.
- Cross-references backend route truth from `../winoe-backend/app/**/routes/**`.
- Inline source comments remain disallowed by ESLint (`no-comments/disallowComments`), so module-level docs live in catalogs.

## Documents

- `docs/frontend/inventory.md`: tracked documentation inventory (`Document | Location | Status | Issues | Action`).
- `docs/frontend/routes.md`: current route map (App routes, API routes, middleware boundary).
- `docs/frontend/pages.md`: route-by-route page behavior, params, load-time calls, and UX states.
- `docs/frontend/flows.md`: candidate and talent_partner user flows mapped to current UI behavior.
- `docs/frontend/api-integration.md`: canonical endpoint matrix with frontend callsites, payloads, auth mode, usage sites, and backend verification status.
- `docs/frontend/api-map.md`: short summary and pointer to `api-integration.md`.
- `docs/frontend/config.md`: runtime/build/test config and env var references.
- `docs/frontend/local-dev.md`: local setup and verification steps.
- `docs/frontend/planned.md`: known implementation gaps and integration follow-ups.
- `docs/frontend/components-catalog.md`: generated full-sweep catalog for all `src/**/*.tsx` component/page modules.
- `docs/frontend/hooks-catalog.md`: generated full-sweep catalog for exported `use*` hooks.
- `docs/frontend/utilities-catalog.md`: generated full-sweep catalog for utility/constants/type modules.

## Related

- Root `README.md`: onboarding and command entrypoint.
- `docs/README_COPY.md`: exact copy of root README.
