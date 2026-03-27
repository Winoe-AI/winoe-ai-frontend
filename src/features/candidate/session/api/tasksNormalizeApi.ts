import { toNumberOrNull, toStringOrNull } from './baseApi';
import type { CandidateTask } from './typesApi';
import {
  findNestedCutoffRecord,
  readCutoffAt,
  readCutoffCommitSha,
} from './tasksNormalize.cutoffApi';
import { asRecord } from './tasksNormalize.primitivesApi';
import { findRecordedSubmission } from './tasksNormalize.submissionApi';

export const normalizeTask = (raw: unknown): CandidateTask | null => {
  const rec = asRecord(raw);
  if (!rec) return null;

  const id = toNumberOrNull(rec.id);
  const dayIndex = toNumberOrNull(rec.dayIndex ?? rec.day_index);
  if (id === null || dayIndex === null) return null;

  const nestedCutoffRecord = findNestedCutoffRecord(rec);
  const cutoffCommitSha =
    readCutoffCommitSha(rec) ??
    (nestedCutoffRecord ? readCutoffCommitSha(nestedCutoffRecord) : null);
  const cutoffAt =
    readCutoffAt(rec) ??
    (nestedCutoffRecord ? readCutoffAt(nestedCutoffRecord) : null);

  return {
    id,
    dayIndex,
    title: toStringOrNull(rec.title) ?? 'Task',
    description: toStringOrNull(rec.description) ?? '',
    type: toStringOrNull(rec.type) ?? 'code',
    recordedSubmission: findRecordedSubmission(rec),
    cutoffCommitSha,
    cutoffAt,
  };
};
