import type {
  FitProfileDayScore,
  FitProfileReport,
  FitProfileVersion,
} from './fitProfile.types';
import {
  asRecord,
  toNullableString,
  toPositiveIntList,
  toUnitInterval,
  toNumberOrNull,
} from './fitProfile.normalize.base';
import { normalizeDayScore } from './fitProfile.normalizeDayScore';
import { normalizeWarnings } from './fitProfile.normalizeWarnings';

export function normalizeVersion(value: unknown): FitProfileVersion | null {
  const record = asRecord(value);
  if (!record) return null;
  return {
    model: toNullableString(record.model),
    promptVersion: toNullableString(record.promptVersion ?? record.prompt_version),
    rubricVersion: toNullableString(record.rubricVersion ?? record.rubric_version),
    modelVersion: toNullableString(record.modelVersion ?? record.model_version),
  };
}

export function normalizeReport(value: unknown): FitProfileReport | null {
  const record = asRecord(value);
  if (!record) return null;
  const dayScoresRaw =
    (Array.isArray(record.dayScores) ? record.dayScores : null) ??
    (Array.isArray(record.day_scores) ? record.day_scores : []);
  const disabledDayIndexes = toPositiveIntList(
    record.disabledDayIndexes ?? record.disabled_day_indexes,
  );
  const disabledDaySet = new Set(disabledDayIndexes);
  const dayScores = dayScoresRaw
    .map((item) => normalizeDayScore(item, disabledDaySet))
    .filter((item): item is FitProfileDayScore => Boolean(item));

  const existingDayIndexes = new Set(dayScores.map((item) => item.dayIndex));
  disabledDayIndexes.forEach((dayIndex) => {
    if (existingDayIndexes.has(dayIndex)) return;
    dayScores.push({
      dayIndex,
      score: null,
      rubricBreakdown: {},
      evidence: [],
      evaluationStatus: 'not_evaluated',
      reason: 'ai_eval_disabled_for_day',
      aiEvaluationEnabled: false,
    });
  });
  dayScores.sort((a, b) => a.dayIndex - b.dayIndex);

  return {
    overallFitScore: toUnitInterval(record.overallFitScore ?? record.overall_fit_score),
    recommendation: toNullableString(record.recommendation) ?? 'lean_hire',
    confidence: toNumberOrNull(record.confidence),
    calibrationText:
      toNullableString(
        record.calibrationText ??
          record.calibration_text ??
          record.calibrationLanguage ??
          record.calibration_language,
      ) ?? null,
    dayScores,
    disabledDayIndexes,
    version: normalizeVersion(record.version),
    warnings: normalizeWarnings(null, record),
  };
}
