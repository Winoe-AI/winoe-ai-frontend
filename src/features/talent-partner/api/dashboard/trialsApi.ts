import { NextResponse } from 'next/server';
import { parseUpstreamBody, upstreamRequest } from '@/platform/server/bff';
import type { TrialListItem } from '@/features/talent-partner/types';
import {
  extractMeta,
  forbiddenResponse,
  normalizeErrorMessage,
} from './normalizeApi';

export type TrialsResult = {
  trials: TrialListItem[];
  error: string | null;
  status: number | null;
  meta?: { attempts?: number; durationMs?: number };
  response?: NextResponse;
};

export async function fetchTrials(args: {
  backendBase: string;
  headers: Record<string, string>;
  requestId: string;
  signal?: AbortSignal;
  profileStatus?: number | null;
}): Promise<TrialsResult> {
  const res = await upstreamRequest({
    url: `${args.backendBase}/api/trials`,
    headers: args.headers,
    cache: 'no-store',
    requestId: args.requestId,
    signal: args.signal,
    maxTotalTimeMs: 15000,
  });

  const meta = extractMeta(res);
  const body = await parseUpstreamBody(res);

  if (res.status === 401 || res.status === 403) {
    return {
      response: forbiddenResponse(
        body,
        res.status,
        args.requestId,
        args.profileStatus ?? null,
      ),
      trials: [],
      error: null,
      status: res.status,
      meta,
    };
  }

  if (res.status >= 500) {
    return {
      trials: [],
      error: normalizeErrorMessage(body, 'Failed to load trials.'),
      status: res.status,
      meta,
    };
  }

  const trials = Array.isArray(body) ? (body as TrialListItem[]) : [];
  const error = !res.ok
    ? normalizeErrorMessage(body, 'Failed to load trials.')
    : null;

  return { trials, error, status: res.status, meta };
}
