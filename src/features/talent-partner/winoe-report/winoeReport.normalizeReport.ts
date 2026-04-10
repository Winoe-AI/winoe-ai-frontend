import type {
  WinoeReportDayScore,
  WinoeReportReport,
  WinoeReportVersion,
} from './winoeReport.types';
import {
  asRecord,
  toNullableString,
  toPositiveIntList,
  toUnitInterval,
  toNumberOrNull,
} from './winoeReport.normalize.base';
import { normalizeDayScore } from './winoeReport.normalizeDayScore';
import { normalizeWarnings } from './winoeReport.normalizeWarnings';

export function normalizeVersion(value: unknown): WinoeReportVersion | null {
  const record = asRecord(value);
  if (!record) return null;
  return {
    model: toNullableString(record.model),
    promptVersion: toNullableString(
      record.promptVersion ?? record.prompt_version,
    ),
    rubricVersion: toNullableString(
      record.rubricVersion ?? record.rubric_version,
    ),
    modelVersion: toNullableString(record.modelVersion ?? record.model_version),
  };
}

export function normalizeReport(value: unknown): WinoeReportReport | null {
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
    .filter((item): item is WinoeReportDayScore => Boolean(item));

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
    overallWinoeScore: toUnitInterval(
      record.overallWinoeScore ?? record.overall_winoe_score,
    ),
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
