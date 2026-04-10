import { parseDayCompletionFromRecord } from './candidatesCompareNormalize.dayCompletionApi';
import { parseWinoeReportStatus } from './candidatesCompareNormalize.winoeReportApi';
import { parseCandidateIdentity } from './candidatesCompareNormalize.identityApi';
import {
  asRecord,
  normalizeStatus,
  toUnitIntervalOrNull,
} from './candidatesCompareNormalize.recordsApi';
import { resolveCandidateSessionId } from './candidatesCompareNormalize.sessionIdApi';
import {
  sanitizeText,
  toStringList,
} from './candidatesCompareNormalize.textApi';
import type { CandidateCompareRow } from './candidatesCompareNormalize.typesApi';

export type {
  CandidateCompareDayCompletion,
  CandidateCompareWinoeReportStatus,
  CandidateCompareRow,
} from './candidatesCompareNormalize.typesApi';

export function normalizeCandidateCompareRow(
  raw: unknown,
): CandidateCompareRow {
  const record = asRecord(raw) ?? {};
  const candidateSessionId = resolveCandidateSessionId(record);

  const overallWinoeScore = toUnitIntervalOrNull(
    record.overallWinoeScore ?? record.overall_winoe_score,
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
    winoeReportStatus: parseWinoeReportStatus(
      record,
      overallWinoeScore,
      recommendation,
    ),
    overallWinoeScore,
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
