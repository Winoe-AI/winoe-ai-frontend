import { getId, getNumber, getString, isRecord } from './trialUtilsApi';
import type { CreateTrialResponse, TrialListItem } from './typesApi';
import { extractBackendMessage } from '@/platform/api-client/errors/errors';

export const normalizeTrial = (raw: unknown): TrialListItem => {
  if (!isRecord(raw)) {
    return {
      id: '',
      title: 'Untitled trial',
      role: 'Unknown role',
      createdAt: new Date().toISOString(),
      candidateCount: 0,
    };
  }
  const id = getId(raw.id ?? raw.trialId ?? raw.trial_id);
  const title = getString(raw.title ?? raw.trial_title, 'Untitled trial');
  const role = getString(raw.role ?? raw.role_name, 'Unknown role');
  const createdAt = getString(
    raw.createdAt ?? raw.created_at,
    new Date().toISOString(),
  );
  const candidateCount =
    getNumber(raw.candidateCount) ??
    getNumber(raw.candidate_count) ??
    getNumber(raw.numCandidates) ??
    getNumber(raw.num_candidates) ??
    0;
  const status =
    typeof raw.status === 'string'
      ? raw.status
      : typeof raw.lifecycleStatus === 'string'
        ? raw.lifecycleStatus
        : typeof raw.lifecycle_status === 'string'
          ? raw.lifecycle_status
          : null;
  return {
    id,
    title,
    role,
    createdAt,
    candidateCount,
    status,
  };
};

export const normalizeCreateTrialResponse = (
  raw: unknown,
  status: number,
): CreateTrialResponse => {
  if (!isRecord(raw)) return { ok: false, status, id: '' };
  const id = getId(raw.id ?? raw.trialId ?? raw.trial_id);
  const message =
    typeof raw.message === 'string'
      ? raw.message
      : typeof raw.detail === 'string'
        ? raw.detail
        : (extractBackendMessage(raw, true) ?? undefined);
  const details =
    raw.details ??
    (typeof raw.detail === 'string' ? undefined : raw.detail) ??
    undefined;
  return {
    ok: status >= 200 && status < 300 && Boolean(id),
    status,
    id,
    message,
    details,
  };
};
