import { toNumberOrNull, toStringOrNull } from './baseApi';
import type { CandidateTask } from './typesApi';
import {
  findNestedCutoffRecord,
  readCutoffAt,
  readCutoffCommitSha,
} from './tasksNormalize.cutoffApi';
import { asRecord } from './tasksNormalize.primitivesApi';
import { findRecordedSubmission } from './tasksNormalize.submissionApi';
import {
  DAY3_IMPLEMENTATION_WRAP_UP_DESCRIPTION,
  DAY3_IMPLEMENTATION_WRAP_UP_TITLE,
} from '@/features/candidate/tasks/utils/day3ImplementationWrapUpUtils';

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

  const isDay3 = dayIndex === 3;

  return {
    id,
    dayIndex,
    title: isDay3
      ? DAY3_IMPLEMENTATION_WRAP_UP_TITLE
      : (toStringOrNull(rec.title) ?? 'Task'),
    description: isDay3
      ? DAY3_IMPLEMENTATION_WRAP_UP_DESCRIPTION
      : (toStringOrNull(rec.description) ?? ''),
    type: toStringOrNull(rec.type) ?? 'code',
    recordedSubmission: findRecordedSubmission(rec),
    cutoffCommitSha,
    cutoffAt,
  };
};
