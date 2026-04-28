import type {
  WinoeReportDayScore,
  WinoeReportEvidence,
} from './winoeReport.types';
import {
  asRecord,
  normalizeStatus,
  toNullableString,
  toNumberOrNull,
  toUnitIntervalOrNull,
} from './winoeReport.normalize.base';
import { normalizeEvidence } from './winoeReport.normalizeEvidence';
import { formatDayLabel } from './winoeReport.catalog';

export function normalizeDayEvaluationStatus(
  record: Record<string, unknown>,
  normalizedScore: number | null,
  aiEvaluationEnabled: boolean,
): WinoeReportDayScore['evaluationStatus'] {
  if (!aiEvaluationEnabled) return 'not_evaluated';
  const explicitStatus = normalizeStatus(
    record.status ??
      record.evaluationStatus ??
      record.evaluation_status ??
      record.scoreStatus ??
      record.score_status,
  );
  const explicitNotEvaluated = new Set([
    'not_evaluated',
    'not-evaluated',
    'not evaluated',
    'disabled',
    'excluded',
    'not_scored',
    'not-scored',
    'not scored',
    'unevaluated',
    'skipped',
  ]);
  const explicitEvaluated = new Set(['evaluated', 'scored', 'complete']);
  if (explicitStatus && explicitNotEvaluated.has(explicitStatus))
    return 'not_evaluated';
  if (explicitStatus && explicitEvaluated.has(explicitStatus))
    return 'evaluated';
  const explicitEvaluatedFlag =
    record.evaluated ?? record.isEvaluated ?? record.is_evaluated;
  if (explicitEvaluatedFlag === false) return 'not_evaluated';
  if (explicitEvaluatedFlag === true) return 'evaluated';
  return normalizedScore === null ? 'not_evaluated' : 'evaluated';
}

export function normalizeDayScore(
  value: unknown,
  disabledDaySet: Set<number>,
): WinoeReportDayScore | null {
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
  const evidenceRaw =
    (Array.isArray(record.evidence) ? record.evidence : null) ??
    (Array.isArray(record.artifacts) ? record.artifacts : null) ??
    (Array.isArray(record.evidenceItems) ? record.evidenceItems : null) ??
    (Array.isArray(record.evidence_items) ? record.evidence_items : null) ??
    [];
  const evidence = evidenceRaw
    .map(normalizeEvidence)
    .filter((item): item is WinoeReportEvidence => Boolean(item));
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
    dayLabel: formatDayLabel(normalizedDayIndex),
    score,
    rubricBreakdown: rubricBreakdown ?? {},
    evidence,
    evaluationStatus,
    reason,
    aiEvaluationEnabled,
    summary:
      toNullableString(
        record.summary ??
          record.daySummary ??
          record.day_summary ??
          record.overview ??
          record.notes,
      ) ?? null,
    statusLabel:
      toNullableString(
        record.statusLabel ??
          record.status_label ??
          record.evaluationLabel ??
          record.evaluation_label,
      ) ?? null,
    reviewerSummary:
      toNullableString(
        record.reviewerSummary ??
          record.reviewer_summary ??
          record.subAgentSummary ??
          record.sub_agent_summary,
      ) ?? null,
  };
}
