import { parseDayCompletionFromRecord } from './candidatesCompareNormalize.dayCompletion';
import { parseFitProfileStatus } from './candidatesCompareNormalize.fitProfile';
import { parseCandidateIdentity } from './candidatesCompareNormalize.identity';
import {
  asRecord,
  normalizeStatus,
  toUnitIntervalOrNull,
} from './candidatesCompareNormalize.records';
import { resolveCandidateSessionId } from './candidatesCompareNormalize.sessionId';
import { sanitizeText, toStringList } from './candidatesCompareNormalize.text';
import type { CandidateCompareRow } from './candidatesCompareNormalize.types';

export type {
  CandidateCompareDayCompletion,
  CandidateCompareFitProfileStatus,
  CandidateCompareRow,
} from './candidatesCompareNormalize.types';

export function normalizeCandidateCompareRow(raw: unknown): CandidateCompareRow {
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

export function normalizeCandidateCompareList(payload: unknown): CandidateCompareRow[] {
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
