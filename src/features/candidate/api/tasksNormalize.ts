import { toNumberOrNull, toStringOrNull } from './base';
import type { CandidateTask } from './types';
import {
  findNestedCutoffRecord,
  readCutoffAt,
  readCutoffCommitSha,
} from './tasksNormalize.cutoff';
import { asRecord } from './tasksNormalize.primitives';
import { findRecordedSubmission } from './tasksNormalize.submission';

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
