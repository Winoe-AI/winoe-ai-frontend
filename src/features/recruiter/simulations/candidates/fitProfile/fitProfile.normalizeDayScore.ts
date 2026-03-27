import type {
  FitProfileDayScore,
  FitProfileEvidence,
} from './fitProfile.types';
import {
  asRecord,
  normalizeStatus,
  toNumberOrNull,
  toUnitIntervalOrNull,
} from './fitProfile.normalize.base';
import { normalizeEvidence } from './fitProfile.normalizeEvidence';

export function normalizeDayEvaluationStatus(
  record: Record<string, unknown>,
  normalizedScore: number | null,
  aiEvaluationEnabled: boolean,
): FitProfileDayScore['evaluationStatus'] {
  if (!aiEvaluationEnabled) return 'not_evaluated';
  const explicitStatus = normalizeStatus(
    record.status ??
      record.evaluationStatus ??
      record.evaluation_status ??
      record.scoreStatus ??
      record.score_status,
  );
  const explicitNotEvaluated = new Set([
    'not_evaluated', 'not-evaluated', 'not evaluated', 'disabled', 'excluded',
    'not_scored', 'not-scored', 'not scored', 'unevaluated', 'skipped',
  ]);
  const explicitEvaluated = new Set(['evaluated', 'scored', 'complete']);
  if (explicitStatus && explicitNotEvaluated.has(explicitStatus)) return 'not_evaluated';
  if (explicitStatus && explicitEvaluated.has(explicitStatus)) return 'evaluated';
  const explicitEvaluatedFlag =
    record.evaluated ?? record.isEvaluated ?? record.is_evaluated;
  if (explicitEvaluatedFlag === false) return 'not_evaluated';
  if (explicitEvaluatedFlag === true) return 'evaluated';
  return normalizedScore === null ? 'not_evaluated' : 'evaluated';
}

export function normalizeDayScore(
  value: unknown,
  disabledDaySet: Set<number>,
): FitProfileDayScore | null {
  const record = asRecord(value);
  if (!record) return null;
  const dayIndex = toNumberOrNull(record.dayIndex ?? record.day_index);
  if (dayIndex === null) return null;
  const normalizedDayIndex = Math.max(1, Math.round(dayIndex));
  const status = normalizeStatus(record.status);
  const reason = normalizeStatus(record.reason);
  const aiEvaluationEnabled =
    !disabledDaySet.has(normalizedDayIndex) &&
    status !== 'human_review_required' &&
    reason !== 'ai_eval_disabled_for_day';
  const rubricBreakdown = asRecord(
    record.rubricBreakdown ?? record.rubric_breakdown,
  );
  const evidenceRaw = Array.isArray(record.evidence) ? record.evidence : [];
  const evidence = evidenceRaw
    .map(normalizeEvidence)
    .filter((item): item is FitProfileEvidence => Boolean(item));
  const normalizedScore = toUnitIntervalOrNull(record.score);
  const evaluationStatus = normalizeDayEvaluationStatus(
    record,
    normalizedScore,
    aiEvaluationEnabled,
  );
  const score =
    !aiEvaluationEnabled || evaluationStatus === 'not_evaluated'
      ? null
      : (normalizedScore ?? 0);
  return {
    dayIndex: normalizedDayIndex,
    score,
    rubricBreakdown: rubricBreakdown ?? {},
    evidence,
    evaluationStatus,
    reason,
    aiEvaluationEnabled,
  };
}
