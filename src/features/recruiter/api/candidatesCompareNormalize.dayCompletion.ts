import { asRecord } from './candidatesCompareNormalize.records';
import type { CandidateCompareDayCompletion } from './candidatesCompareNormalize.types';

export function parseDayCompletionFromRecord(
  record: Record<string, unknown>,
): CandidateCompareDayCompletion[] {
  const nested =
    asRecord(record.dayCompletion) ??
    asRecord(record.day_completion) ??
    asRecord(record.dayCompletions) ??
    asRecord(record.day_completions) ??
    asRecord(record.completionByDay) ??
    asRecord(record.completion_by_day);

  const entries: CandidateCompareDayCompletion[] = [];

  for (let dayIndex = 1; dayIndex <= 5; dayIndex += 1) {
    const nestedValue = nested
      ? (nested[String(dayIndex)] ??
        nested[`day${dayIndex}`] ??
        nested[`day_${dayIndex}`])
      : undefined;

    const topLevelValue =
      record[`day${dayIndex}Completed`] ??
      record[`day_${dayIndex}_completed`] ??
      record[`day${dayIndex}_completed`] ??
      record[`day${dayIndex}`];

    const candidate = nestedValue ?? topLevelValue;
    if (candidate === true || candidate === false) {
      entries.push({ dayIndex, completed: candidate });
    }
  }

  return entries;
}
