import { toNumberOrNull } from './baseApi';
import type { CandidateTask } from './typesApi';
import { asRecord, toIsoOrNull } from './tasksNormalize.primitivesApi';

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

export function findRecordedSubmission(
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
