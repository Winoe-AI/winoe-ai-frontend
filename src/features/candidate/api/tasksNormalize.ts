import { toNumberOrNull, toStringOrNull } from './base';
import type { CandidateTask } from './types';

function toIsoOrNull(value: unknown): string | null {
  const iso = toStringOrNull(value);
  if (!iso) return null;
  const ts = Date.parse(iso);
  return Number.isFinite(ts) ? iso : null;
}

function toSubmissionRef(
  raw: unknown,
): CandidateTask['recordedSubmission'] | null {
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  const submissionId = toNumberOrNull(rec.submissionId);
  const submittedAt =
    toIsoOrNull(rec.submittedAt) ??
    toIsoOrNull(rec.submissionAt) ??
    toIsoOrNull(rec.recordedAt);
  if (submissionId === null || !submittedAt) return null;
  return { submissionId, submittedAt };
}

function findRecordedSubmission(
  taskRecord: Record<string, unknown>,
): CandidateTask['recordedSubmission'] | null {
  const directPair = toSubmissionRef({
    submissionId: taskRecord.submissionId,
    submittedAt: taskRecord.submittedAt,
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
  if (id === null || dayIndex === null) return null;
  return {
    id,
    dayIndex,
    title,
    description,
    type,
    recordedSubmission,
  };
};
