import { toNumberOrNull, toStringOrNull } from './base';
import type { CandidateTask } from './types';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toIsoOrNull(value: unknown): string | null {
  const iso = toStringOrNull(value);
  if (!iso) return null;
  const ts = Date.parse(iso);
  return Number.isFinite(ts) ? iso : null;
}

function readCutoffCommitSha(record: Record<string, unknown>): string | null {
  return (
    toStringOrNull(record.cutoffCommitSha ?? record.cutoff_commit_sha) ?? null
  );
}

function readCutoffAt(record: Record<string, unknown>): string | null {
  return (
    toIsoOrNull(record.cutoffAt) ??
    toIsoOrNull(record.cutoff_at) ??
    toIsoOrNull(record.cutoffTime) ??
    toIsoOrNull(record.cutoff_time)
  );
}

function findNestedCutoffRecord(
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

function readSubmissionText(
  record: Record<string, unknown>,
): string | undefined {
  const candidates = [record.contentText, record.content_text];
  for (const candidate of candidates) {
    if (typeof candidate === 'string') return candidate;
  }
  return undefined;
}

function readSubmissionJson(
  record: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const candidates = [record.contentJson, record.content_json];
  for (const candidate of candidates) {
    const parsed = asRecord(candidate);
    if (parsed) return { ...parsed };
  }
  return undefined;
}

function toSubmissionRef(
  raw: unknown,
): CandidateTask['recordedSubmission'] | null {
  const rec = asRecord(raw);
  if (!rec) return null;
  const submissionId = toNumberOrNull(rec.submissionId);
  const submittedAt =
    toIsoOrNull(rec.submittedAt) ??
    toIsoOrNull(rec.submissionAt) ??
    toIsoOrNull(rec.recordedAt);
  if (submissionId === null || !submittedAt) return null;

  const normalized: NonNullable<CandidateTask['recordedSubmission']> = {
    submissionId,
    submittedAt,
  };
  const contentText = readSubmissionText(rec);
  if (contentText !== undefined) normalized.contentText = contentText;
  const contentJson = readSubmissionJson(rec);
  if (contentJson !== undefined) normalized.contentJson = contentJson;

  return normalized;
}

function findRecordedSubmission(
  taskRecord: Record<string, unknown>,
): CandidateTask['recordedSubmission'] | null {
  const directPair = toSubmissionRef({
    submissionId: taskRecord.submissionId,
    submittedAt: taskRecord.submittedAt,
    contentText: taskRecord.contentText ?? taskRecord.content_text,
    contentJson: taskRecord.contentJson ?? taskRecord.content_json,
  });
  if (directPair) return directPair;

  const candidates: unknown[] = [
    taskRecord.recordedSubmission,
    taskRecord.lastSubmission,
    taskRecord.latestSubmission,
    taskRecord.finalSubmission,
    taskRecord.selectedSubmission,
    taskRecord.submission,
  ];

  for (const candidate of candidates) {
    const parsed = toSubmissionRef(candidate);
    if (parsed) return parsed;
  }

  return null;
}

export const normalizeTask = (raw: unknown): CandidateTask | null => {
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  const id = toNumberOrNull(rec.id);
  const dayIndex = toNumberOrNull(rec.dayIndex ?? rec.day_index);
  const title = toStringOrNull(rec.title) ?? 'Task';
  const description = toStringOrNull(rec.description) ?? '';
  const type = toStringOrNull(rec.type) ?? 'code';
  const recordedSubmission = findRecordedSubmission(rec);
  const nestedCutoffRecord = findNestedCutoffRecord(rec);
  const cutoffCommitSha =
    readCutoffCommitSha(rec) ??
    (nestedCutoffRecord ? readCutoffCommitSha(nestedCutoffRecord) : null);
  const cutoffAt =
    readCutoffAt(rec) ??
    (nestedCutoffRecord ? readCutoffAt(nestedCutoffRecord) : null);
  if (id === null || dayIndex === null) return null;
  return {
    id,
    dayIndex,
    title,
    description,
    type,
    recordedSubmission,
    cutoffCommitSha,
    cutoffAt,
  };
};
