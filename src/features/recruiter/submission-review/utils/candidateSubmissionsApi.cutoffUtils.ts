import {
  toIsoOrNull,
  toNullableString,
} from './candidateSubmissionsApi.primitivesUtils';

export function normalizeCutoffFields(record: Record<string, unknown>) {
  return {
    cutoffCommitSha:
      toNullableString(record.cutoffCommitSha ?? record.cutoff_commit_sha) ??
      null,
    cutoffAt:
      toIsoOrNull(record.cutoffAt) ??
      toIsoOrNull(record.cutoff_at) ??
      toIsoOrNull(record.cutoffTime) ??
      toIsoOrNull(record.cutoff_time),
  };
}
