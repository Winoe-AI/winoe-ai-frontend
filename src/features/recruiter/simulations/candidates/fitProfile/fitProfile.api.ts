import { recruiterBffClient } from '@/lib/api/client';
import type {
  FitProfileDayScore,
  FitProfileEvidence,
  FitProfileFetchOutcome,
  FitProfileReport,
  FitProfileVersion,
} from './fitProfile.types';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function toUnitInterval(value: unknown): number {
  const numeric = toNumberOrNull(value);
  if (numeric === null) return 0;
  if (numeric > 1 && numeric <= 100) return Math.min(1, numeric / 100);
  return Math.min(1, Math.max(0, numeric));
}

function toUnitIntervalOrNull(value: unknown): number | null {
  const numeric = toNumberOrNull(value);
  if (numeric === null) return null;
  if (numeric > 1 && numeric <= 100) return Math.min(1, numeric / 100);
  return Math.min(1, Math.max(0, numeric));
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => toNullableString(item))
    .filter((item): item is string => Boolean(item));
}

function toPositiveIntList(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => toNumberOrNull(item))
    .filter((item): item is number => item !== null && item > 0)
    .map((item) => Math.round(item));
}

function normalizeEvidence(value: unknown): FitProfileEvidence | null {
  const record = asRecord(value);
  if (!record) return null;
  const kind = toNullableString(record.kind);
  if (!kind) return null;

  const startMs = toNumberOrNull(record.startMs ?? record.start_ms);
  const endMs = toNumberOrNull(record.endMs ?? record.end_ms);

  return {
    kind,
    ref: toNullableString(record.ref),
    url: toNullableString(record.url),
    excerpt: toNullableString(record.excerpt),
    startMs: startMs === null ? null : Math.max(0, Math.round(startMs)),
    endMs: endMs === null ? null : Math.max(0, Math.round(endMs)),
  };
}

function normalizeDayEvaluationStatus(
  record: Record<string, unknown>,
  normalizedScore: number | null,
  aiEvaluationEnabled: boolean,
): FitProfileDayScore['evaluationStatus'] {
  if (!aiEvaluationEnabled) {
    return 'not_evaluated';
  }

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
  if (explicitStatus && explicitNotEvaluated.has(explicitStatus)) {
    return 'not_evaluated';
  }
  if (explicitStatus && explicitEvaluated.has(explicitStatus)) {
    return 'evaluated';
  }

  const explicitEvaluatedFlag =
    record.evaluated ?? record.isEvaluated ?? record.is_evaluated;
  if (explicitEvaluatedFlag === false) return 'not_evaluated';
  if (explicitEvaluatedFlag === true) return 'evaluated';

  return normalizedScore === null ? 'not_evaluated' : 'evaluated';
}

function normalizeDayScore(
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

function normalizeVersion(value: unknown): FitProfileVersion | null {
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

function includeWarning(target: string[], warning: string | null) {
  if (!warning) return;
  if (target.includes(warning)) return;
  target.push(warning);
}

function normalizeWarnings(
  payloadRecord: Record<string, unknown> | null,
  reportRecord: Record<string, unknown> | null,
): string[] {
  const warnings: string[] = [];

  const warnKeys = [
    payloadRecord?.warnings,
    payloadRecord?.warning,
    payloadRecord?.warningMessage,
    payloadRecord?.warning_message,
    reportRecord?.warnings,
    reportRecord?.warning,
    reportRecord?.warningMessage,
    reportRecord?.warning_message,
  ];
  warnKeys.forEach((value) => {
    if (Array.isArray(value)) {
      toStringList(value).forEach((warning) =>
        includeWarning(warnings, warning),
      );
      return;
    }
    includeWarning(warnings, toNullableString(value));
  });

  const partialFlags = [
    payloadRecord?.partial,
    payloadRecord?.isPartial,
    payloadRecord?.partialArtifactFailure,
    payloadRecord?.partial_artifact_failure,
    reportRecord?.partial,
    reportRecord?.isPartial,
    reportRecord?.partialArtifactFailure,
    reportRecord?.partial_artifact_failure,
  ];
  const hasPartialFlag = partialFlags.some((item) => item === true);
  if (hasPartialFlag) {
    includeWarning(
      warnings,
      'Some artifacts were unavailable. The report is based on partial evidence.',
    );
  }

  return warnings;
}

function normalizeReport(value: unknown): FitProfileReport | null {
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

  const reportWarnings = normalizeWarnings(null, record);

  return {
    overallFitScore: toUnitInterval(
      record.overallFitScore ?? record.overall_fit_score,
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
    warnings: reportWarnings,
  };
}

function normalizeStatus(value: unknown): string | null {
  const status = toNullableString(value);
  return status ? status.toLowerCase() : null;
}

export function normalizeFitProfilePayload(
  payload: unknown,
): FitProfileFetchOutcome {
  const record = asRecord(payload);
  if (!record) {
    return {
      kind: 'failed',
      errorCode: 'fit_profile_payload_invalid',
      message: 'Fit Profile payload was invalid.',
    };
  }

  const topLevelWarnings = normalizeWarnings(record, null);
  const status = normalizeStatus(record.status);

  if (status === 'running') {
    return { kind: 'running', warnings: topLevelWarnings };
  }

  if (status === 'not_started') {
    return { kind: 'not_started' };
  }

  if (status === 'failed') {
    return {
      kind: 'failed',
      errorCode: toNullableString(record.errorCode ?? record.error_code),
      message: 'Fit Profile generation failed. Please retry.',
    };
  }

  const reportCandidate =
    asRecord(record.report) ??
    (record.overallFitScore !== undefined ? record : null) ??
    (record.overall_fit_score !== undefined ? record : null);

  if (status === 'ready' || reportCandidate) {
    const report = normalizeReport(reportCandidate);
    if (!report) {
      return {
        kind: 'failed',
        errorCode: 'fit_profile_report_invalid',
        message: 'Fit Profile report was missing or invalid.',
      };
    }
    const warnings = Array.from(
      new Set([...topLevelWarnings, ...report.warnings]),
    );
    return {
      kind: 'ready',
      report: { ...report, warnings },
      generatedAt: toNullableString(record.generatedAt ?? record.generated_at),
      warnings,
    };
  }

  return { kind: 'not_started' };
}

export async function fetchCandidateFitProfile(
  candidateSessionId: string,
  signal?: AbortSignal,
  options?: { skipCache?: boolean },
): Promise<FitProfileFetchOutcome> {
  const encodedId = encodeURIComponent(candidateSessionId);
  const payload = await recruiterBffClient.get<unknown>(
    `/candidate_sessions/${encodedId}/fit_profile`,
    {
      cache: 'no-store',
      signal,
      skipCache: options?.skipCache,
      cacheTtlMs: 10_000,
      dedupeKey: `fit-profile-status-${candidateSessionId}`,
    },
  );
  return normalizeFitProfilePayload(payload);
}

export async function generateCandidateFitProfile(
  candidateSessionId: string,
): Promise<void> {
  const encodedId = encodeURIComponent(candidateSessionId);
  await recruiterBffClient.post<unknown>(
    `/candidate_sessions/${encodedId}/fit_profile/generate`,
    {},
    {
      cache: 'no-store',
      skipCache: true,
      disableDedupe: true,
      cacheTtlMs: 0,
    },
  );
}
