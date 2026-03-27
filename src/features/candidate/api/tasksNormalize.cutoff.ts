import { toStringOrNull } from './base';
import { asRecord, toIsoOrNull } from './tasksNormalize.primitives';

export function readCutoffCommitSha(
  record: Record<string, unknown>,
): string | null {
  return (
    toStringOrNull(record.cutoffCommitSha ?? record.cutoff_commit_sha) ?? null
  );
}

export function readCutoffAt(record: Record<string, unknown>): string | null {
  return (
    toIsoOrNull(record.cutoffAt) ??
    toIsoOrNull(record.cutoff_at) ??
    toIsoOrNull(record.cutoffTime) ??
    toIsoOrNull(record.cutoff_time)
  );
}

export function findNestedCutoffRecord(
  taskRecord: Record<string, unknown>,
): Record<string, unknown> | null {
  const nestedCandidates: unknown[] = [
    taskRecord.workspaceStatus,
    taskRecord.workspace_status,
    taskRecord.workspace,
    taskRecord.integrity,
    taskRecord.evaluationBasis,
    taskRecord.evaluation_basis,
  ];
  for (const candidate of nestedCandidates) {
    const parsed = asRecord(candidate);
    if (!parsed) continue;
    if (readCutoffCommitSha(parsed) || readCutoffAt(parsed)) return parsed;
  }
  return null;
}
