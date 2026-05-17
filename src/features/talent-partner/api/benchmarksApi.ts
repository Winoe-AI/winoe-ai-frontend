import { safeId, talentPartnerBffClient } from './trialUtilsApi';

export type BenchmarkStatus =
  | 'completed'
  | 'in_progress'
  | 'report_pending'
  | 'evaluated';

export type BenchmarkDimension = {
  name: string;
  score: number;
};

export type BenchmarkCandidate = {
  id: string;
  name: string;
  email: string;
  trial_id: string;
  trial_title: string;
  report_id: string | null;
  winoe_score: number | null;
  dimensions: BenchmarkDimension[];
  status: BenchmarkStatus;
  submitted_at: string | null;
};

export type BenchmarksResponse = {
  cohort: {
    n: number;
    median: number | null;
    mean: number | null;
    range: [number, number] | null;
    sufficient: boolean;
  };
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
  candidates: BenchmarkCandidate[];
};

export type BenchmarkCompareCandidate = BenchmarkCandidate & {
  score_ring: number | null;
  radar_dimensions: BenchmarkDimension[];
};

export type BenchmarkCompareResponse = {
  candidates: BenchmarkCompareCandidate[];
};

export type BenchmarkQueryOptions = {
  signal?: AbortSignal;
  cache?: RequestCache;
  skipCache?: boolean;
  cacheTtlMs?: number;
  dedupeKey?: string;
  disableDedupe?: boolean;
};

export async function getBenchmarks(
  params: {
    trialId: string | number;
    status?: string | null;
    timeRange?: string | null;
    page?: number;
    pageSize?: number;
  },
  options?: BenchmarkQueryOptions,
): Promise<BenchmarksResponse | null> {
  const trialId = safeId(params.trialId);
  if (!trialId) return null;
  const query = new URLSearchParams();
  query.set('trial_id', trialId);
  if (params.status && params.status !== 'all')
    query.set('status', params.status);
  if (params.timeRange && params.timeRange !== 'all') {
    query.set('time_range', params.timeRange);
  }
  query.set('page', String(Math.max(1, params.page ?? 1)));
  query.set(
    'page_size',
    String(Math.min(100, Math.max(1, params.pageSize ?? 25))),
  );

  const payload = await talentPartnerBffClient.get<unknown>(
    `/v1/benchmarks?${query.toString()}`,
    {
      cache: options?.cache ?? 'no-store',
      signal: options?.signal,
      skipCache: options?.skipCache,
      cacheTtlMs: options?.cacheTtlMs ?? 10_000,
      dedupeKey: options?.dedupeKey ?? `benchmarks-${trialId}`,
      disableDedupe: options?.disableDedupe,
    },
  );
  return payload as BenchmarksResponse;
}

export async function getBenchmarkCompare(
  candidateIds: Array<string | number>,
  options?: BenchmarkQueryOptions,
): Promise<BenchmarkCompareResponse | null> {
  const ids = candidateIds.map((id) => safeId(id)).filter(Boolean);
  if (ids.length < 2 || ids.length > 3) return null;
  const payload = await talentPartnerBffClient.get<unknown>(
    `/v1/benchmarks/compare?candidate_ids=${encodeURIComponent(ids.join(','))}`,
    {
      cache: options?.cache ?? 'no-store',
      signal: options?.signal,
      skipCache: options?.skipCache,
      cacheTtlMs: options?.cacheTtlMs ?? 10_000,
      dedupeKey: options?.dedupeKey ?? `benchmarks-compare-${ids.join('-')}`,
      disableDedupe: options?.disableDedupe,
    },
  );
  return payload as BenchmarkCompareResponse;
}
