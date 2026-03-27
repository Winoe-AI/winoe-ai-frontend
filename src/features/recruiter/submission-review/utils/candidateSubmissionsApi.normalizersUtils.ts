import type { SubmissionArtifact, SubmissionListResponse } from '../types';
import { normalizeCutoffFields } from './candidateSubmissionsApi.cutoffUtils';
import { normalizeHandoff } from './candidateSubmissionsApi.handoffUtils';

export function normalizeListResponse(
  data: SubmissionListResponse,
): SubmissionListResponse {
  const normalizedItems = Array.isArray(data?.items)
    ? data.items.map((item) => {
        if (!item || typeof item !== 'object') return item;
        const rec = item as unknown as Record<string, unknown>;
        return {
          ...item,
          ...normalizeCutoffFields(rec),
        };
      })
    : [];

  return {
    items: normalizedItems,
  };
}

export function normalizeArtifact(
  data: SubmissionArtifact,
): SubmissionArtifact {
  if (!data || typeof data !== 'object') return data;
  const rec = data as unknown as Record<string, unknown>;
  return {
    ...data,
    ...normalizeCutoffFields(rec),
    handoff: normalizeHandoff(rec),
  };
}
