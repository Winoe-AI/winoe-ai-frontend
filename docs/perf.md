# Performance Results & How to Measure

## How to enable perf logging

- Set `NEXT_PUBLIC_WINOE_DEBUG_PERF=1` (env or `.env.local`) before running `npm run dev` or `npm run build`.
- Logs you’ll see:
  - `[perf:web-vitals]` LCP/INP/CLS (already wired).
  - `[api][perf]` per-request timings; `cache: "dedupe"` means in-flight coalescing, `cache: "memory"` only appears when a call opts into a TTL cache.
  - `[perf:ui]` client-side marks around candidate task bootstrap/fetch.
- Cache semantics:
  - GET dedupe is on by default.
  - TTL response cache is **opt-in** per call: pass `cacheTtlMs` (>0) to enable. Default is 0.
  - Polling/live endpoints: pass `cacheTtlMs: 0` or `skipCache: true`; set `disableDedupe: true` only if overlapping polls must not coalesce.

## Manual before/after checklist (do this in Incognito with DevTools open)

1. For each key route:
   - Candidate invite verify `/candidate-sessions/[token]`
   - Candidate session `/candidate/session/[token]` (Day1 + Day2/Day3)
   - Talent Partner dashboard `/dashboard`
   - Trial detail candidates table `/dashboard/trials/[id]`
   - Candidate artifacts/submissions `/dashboard/trials/[id]/candidates/[candidateSessionId]`
   - Winoe Report view: **not present in this frontend** (N/A). If added later, measure similarly.
2. In DevTools > Network: check **Disable cache**, reload, and record:
   - Total requests, duplicate GETs (dedupe trims overlap; TTL cache only where explicitly enabled).
   - Waterfall start times (trial detail plan + candidates start together; submissions list loads after candidate verification, artifacts fetched per-page instead of all-at-once).
3. In DevTools > Performance or Lighthouse:
   - Capture LCP, INP, CLS. Ensure skeletons hold layout (no large shifts).
   - Note “First Contentful Paint” and “JS total” for regressions.
4. Record UI responsiveness:
   - Run Tests panel responsiveness (already instrumented).
   - Candidate workspace panel: manual refresh only; no background polling.
   - Codespace polling: **not applicable / not found** (searched `codespace` in `src/features/candidate/session/task/components/WorkspacePanel.tsx` and related API helpers; only on-demand calls exist).

## Bundle sizes (route-level JS, client chunk only)

Approximate, from `.next/static/chunks/app/.../page-*.js` (KB, rounded). For source of truth, run `npm run analyze` and open `.next/analyze/client.html`.

| Route                           | Baseline (before PR) | After (this PR) | Notes                                                                                           |
| ------------------------------- | -------------------- | --------------- | ----------------------------------------------------------------------------------------------- |
| Candidate verify                | 1 KB                 | ~1 KB           | No change                                                                                       |
| Candidate session               | 46 KB                | 46 KB           | Same chunk; perf marks already present                                                          |
| Talent Partner dashboard        | 14 KB                | 13 KB           | Request dedupe reduces refetches                                                                |
| Trial detail                    | 31 KB                | 30 KB           | Slightly smaller; same UI                                                                       |
| Candidate submissions/artifacts | 21 KB                | 28 KB           | Main chunk includes pagination/debounce; Markdown/remark stays in a lazy chunk loaded on expand |

How to reproduce:

- `npm run analyze`
- Open `.next/analyze/client.html` for a visual diff; route chunks above come from the `page-*.js` entries under `.next/static/chunks/app/...`.
- To compare with `main`/baseline, run `npm run analyze` on that branch and re-run the table script in this file (or the one in the PR description).

## What changed (perf-focused)

- **Request efficiency:** GET dedupe on by default; TTL cache is opt-in (per-call `cacheTtlMs`). Talent Partner dashboard/trial detail/candidate submissions use the shared client with skipCache escape hatches.
- **Waterfall reduction:** Trial detail plan + candidates fetch together. Candidate submissions: validate candidate first, then load list; artifacts fetch only latest Day2/Day3 plus the current page (8 per page) with small concurrency limits instead of all-at-once.
- **Code splitting:** Talent Partner artifact markdown is lazy-loaded and only mounted when expanded; keeps initial chunk lean and prevents SSR→CSR flashes.
- **UI responsiveness:** Trial candidate search debounced (~180ms); submissions list paginated (8/page) to cap DOM size and avoid rerender churn.
- **CLS polish:** Skeletons and list pagination keep layout stable on talent_partner artifacts/detail pages; candidate session skeleton already sized.

## Not applicable / searches

- **Winoe Report view**: not present (searched `Winoe Report`, `WinoeReport`, `winoe_report`, `winoe-report`, `winoe report` across `src/`).
- **Codespace polling**: none found (search `codespace` in workspace panel + API); workspace refresh is user-driven only.
- **Heavy diff/monaco/editor viewers**: none found (searched `monaco`, `diff editor`, `react-monaco`, `diffviewer` across `src/`); no extra gating required yet.

## Quick measurement playbook (copy/paste)

- `NEXT_PUBLIC_WINOE_DEBUG_PERF=1 npm run dev`
- Open route, run Lighthouse (mobile, clear storage). Record LCP/INP/CLS + “JS total”.
- DevTools Network (disable cache): count requests and note `[api][perf]` cache hits.
- Optional bundle check: `npm run analyze` → open `.next/analyze/client.html` and screenshot key routes.
