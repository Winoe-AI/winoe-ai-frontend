# Unit tests

Layout is feature-first to mirror the app:

- `app/` – Next.js page/content components.
- `components/` – reusable UI blocks.
- `features/` – feature-specific units (e.g., talent_partner).
- `lib/` – API clients and utilities.
- `talent_partner/` – helper units specific to talent_partner features.
- Root files like `candidateApi.test.ts` cover cross-cutting modules.

Shared helpers:

- Use `tests/setup` (barrel export) for common utilities like `renderCandidateWithProviders` and the lightweight `createMockServer`.

Conventions:

- Co-locate mocks at the top of each file; prefer reusing shared helpers before inlining stubs.
- Name tests after the unit under test (`<FileName>.test.ts[x]`) and keep scenarios narrow to avoid duplication with integration tests.
