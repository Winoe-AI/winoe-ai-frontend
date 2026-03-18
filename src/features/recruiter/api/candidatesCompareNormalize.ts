import { toNumberOrNull, toStringOrNull } from './simUtils';

export type CandidateCompareFitProfileStatus =
  | 'not_generated'
  | 'generating'
  | 'ready'
  | 'failed';

export type CandidateCompareDayCompletion = {
  dayIndex: number;
  completed: boolean;
};

export type CandidateCompareRow = {
  candidateSessionId: string;
  candidateName: string | null;
  candidateEmail: string | null;
  candidateLabel: string;
  status: string | null;
  fitProfileStatus: CandidateCompareFitProfileStatus;
  overallFitScore: number | null;
  recommendation: string | null;
  updatedAt: string | null;
  strengths: string[];
  risks: string[];
  dayCompletion: CandidateCompareDayCompletion[];
};

const FIT_PROFILE_READY = new Set([
  'ready',
  'generated',
  'complete',
  'completed',
  'available',
]);

const FIT_PROFILE_GENERATING = new Set([
  'generating',
  'running',
  'queued',
  'pending',
  'in_progress',
  'in progress',
]);

const FIT_PROFILE_FAILED = new Set(['failed', 'error']);

const FIT_PROFILE_MISSING = new Set([
  'not_generated',
  'not generated',
  'not_started',
  'not started',
  'missing',
  'none',
  'absent',
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function normalizeStatus(value: unknown): string | null {
  const raw = toStringOrNull(value);
  return raw ? raw.toLowerCase() : null;
}

function toUnitIntervalOrNull(value: unknown): number | null {
  const parsed = toNumberOrNull(value);
  if (parsed === null) return null;
  if (parsed > 1 && parsed <= 100) {
    return Math.min(1, Math.max(0, parsed / 100));
  }
  return Math.min(1, Math.max(0, parsed));
}

function hasSensitiveQuery(url: URL): boolean {
  const sensitiveKeys = new Set([
    'x-amz-signature',
    'x-amz-credential',
    'x-amz-security-token',
    'x-goog-signature',
    'x-goog-credential',
    'googleaccessid',
    'signature',
    'sig',
    'token',
  ]);
  for (const key of url.searchParams.keys()) {
    if (sensitiveKeys.has(key.toLowerCase())) {
      return true;
    }
  }
  return false;
}

function isSensitiveText(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;

  try {
    const parsed = new URL(trimmed);
    if (hasSensitiveQuery(parsed)) return true;
  } catch {
    if (/x-amz-signature=|x-goog-signature=|googleaccessid=/i.test(trimmed)) {
      return true;
    }
  }

  return false;
}

function sanitizeText(value: unknown, maxLength = 140): string | null {
  const raw = toStringOrNull(value);
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (isSensitiveText(trimmed)) return null;
  return trimmed.slice(0, maxLength);
}

function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeText(item, 96))
      .filter((item): item is string => Boolean(item));
  }

  const raw = toStringOrNull(value);
  if (!raw) return [];

  const normalized = raw.trim();
  if (!normalized) return [];

  if (normalized.includes(',')) {
    return normalized
      .split(',')
      .map((part) => sanitizeText(part, 96))
      .filter((item): item is string => Boolean(item));
  }

  const single = sanitizeText(normalized, 96);
  return single ? [single] : [];
}

function parseFitProfileStatus(
  record: Record<string, unknown>,
  score: number | null,
  recommendation: string | null,
): CandidateCompareFitProfileStatus {
  const fitProfileRecord = asRecord(record.fitProfile);
  const fitProfileSnakeRecord = asRecord(record.fit_profile);
  const normalized = normalizeStatus(
    record.fitProfileStatus ??
      record.fit_profile_status ??
      fitProfileRecord?.status ??
      fitProfileSnakeRecord?.status ??
      record.reportStatus ??
      record.report_status,
  );

  if (normalized && FIT_PROFILE_READY.has(normalized)) return 'ready';
  if (normalized && FIT_PROFILE_GENERATING.has(normalized)) return 'generating';
  if (normalized && FIT_PROFILE_FAILED.has(normalized)) return 'failed';
  if (normalized && FIT_PROFILE_MISSING.has(normalized)) return 'not_generated';

  if (score !== null || recommendation !== null) return 'ready';
  return 'not_generated';
}

function parseCandidateIdentity(record: Record<string, unknown>): {
  candidateName: string | null;
  candidateEmail: string | null;
  candidateLabel: string;
} {
  const candidateRecord = asRecord(record.candidate);
  const candidateName =
    sanitizeText(
      candidateRecord?.name ??
        candidateRecord?.candidateName ??
        record.candidateName ??
        record.candidate_name,
      80,
    ) ?? null;
  const candidateEmail =
    sanitizeText(
      candidateRecord?.email ??
        candidateRecord?.inviteEmail ??
        record.inviteEmail ??
        record.invite_email ??
        record.email,
      96,
    ) ?? null;

  const explicitLabel =
    sanitizeText(
      candidateRecord?.label ?? candidateRecord?.display ?? record.candidate,
      96,
    ) ?? null;

  const fallback = candidateName ?? candidateEmail;
  return {
    candidateName,
    candidateEmail,
    candidateLabel: explicitLabel ?? fallback ?? 'Candidate',
  };
}

function parseDayCompletionFromRecord(
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

function resolveCandidateSessionId(record: Record<string, unknown>): string {
  const raw =
    toStringOrNull(
      record.candidateSessionId ??
        record.candidate_session_id ??
        record.sessionId ??
        record.session_id ??
        record.id,
    ) ?? null;

  if (raw) return raw;

  const numeric = toNumberOrNull(
    record.candidateSessionId ??
      record.candidate_session_id ??
      record.sessionId ??
      record.session_id ??
      record.id,
  );

  if (numeric === null) return '';
  return String(Math.round(numeric));
}

export function normalizeCandidateCompareRow(
  raw: unknown,
): CandidateCompareRow {
  const record = asRecord(raw) ?? {};
  const candidateSessionId = resolveCandidateSessionId(record);

  const overallFitScore = toUnitIntervalOrNull(
    record.overallFitScore ?? record.overall_fit_score,
  );
  const recommendation =
    sanitizeText(record.recommendation, 48) ??
    sanitizeText(record.recommendationLabel ?? record.recommendation_label, 48);

  const identity = parseCandidateIdentity(record);

  return {
    candidateSessionId,
    candidateName: identity.candidateName,
    candidateEmail: identity.candidateEmail,
    candidateLabel: identity.candidateLabel,
    status:
      normalizeStatus(
        record.status ?? record.sessionStatus ?? record.session_status,
      ) ?? null,
    fitProfileStatus: parseFitProfileStatus(
      record,
      overallFitScore,
      recommendation,
    ),
    overallFitScore,
    recommendation,
    updatedAt:
      sanitizeText(
        record.updatedAt ?? record.updated_at ?? record.lastUpdated,
        48,
      ) ?? null,
    strengths: toStringList(
      record.strengths ?? record.keyStrengths ?? record.key_strengths,
    ),
    risks: toStringList(record.risks ?? record.keyRisks ?? record.key_risks),
    dayCompletion: parseDayCompletionFromRecord(record),
  };
}

export function normalizeCandidateCompareList(
  payload: unknown,
): CandidateCompareRow[] {
  const records = asRecord(payload);
  const list =
    (Array.isArray(payload)
      ? payload
      : Array.isArray(records?.items)
        ? records.items
        : Array.isArray(records?.candidates)
          ? records.candidates
          : Array.isArray(records?.rows)
            ? records.rows
            : []) ?? [];

  return list
    .map((row) => normalizeCandidateCompareRow(row))
    .filter((row) => row.candidateSessionId.length > 0);
}
