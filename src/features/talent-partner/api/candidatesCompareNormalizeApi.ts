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

function resolveTrialId(
  record: Record<string, unknown>,
  inheritedTrialId: string | null,
): string | null {
  const candidateRecord = asRecord(record.candidate);
  const rawTrialId =
    sanitizeText(
      record.trialId ??
        record.trial_id ??
        record.selectedTrialId ??
        record.selected_trial_id ??
        record.inviteTrialId ??
        record.invite_trial_id ??
        record.candidateTrialId ??
        record.candidate_trial_id ??
        record.sessionTrialId ??
        record.session_trial_id ??
        candidateRecord?.trialId ??
        candidateRecord?.trial_id,
      96,
    ) ?? inheritedTrialId;
  return rawTrialId ?? null;
}

export type {
  CandidateCompareDayCompletion,
  CandidateCompareWinoeReportStatus,
  CandidateCompareRow,
} from './candidatesCompareNormalize.typesApi';

export function normalizeCandidateCompareRow(
  raw: unknown,
  inheritedTrialId: string | null = null,
): CandidateCompareRow {
  const record = asRecord(raw) ?? {};
  const candidateSessionId = resolveCandidateSessionId(record);
  const trialId = resolveTrialId(record, inheritedTrialId);

  const overallWinoeScore = toUnitIntervalOrNull(
    record.overallWinoeScore ?? record.overall_winoe_score,
  );
  const recommendation =
    sanitizeText(record.recommendation, 48) ??
    sanitizeText(record.recommendationLabel ?? record.recommendation_label, 48);

  const identity = parseCandidateIdentity(record);

  return {
    candidateSessionId,
    trialId,
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
  const inheritedTrialId =
    sanitizeText(
      records?.trialId ??
        records?.trial_id ??
        records?.selectedTrialId ??
        records?.selected_trial_id,
      96,
    ) ?? null;
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
    .map((row) => normalizeCandidateCompareRow(row, inheritedTrialId))
    .filter((row) => row.candidateSessionId.length > 0);
}

export function isCandidateCompareRowForTrial(
  row: CandidateCompareRow,
  trialId: string,
): boolean {
  const selectedTrialId = sanitizeText(trialId, 96);
  if (!selectedTrialId) return true;
  if (!row.trialId) return true;
  return row.trialId === selectedTrialId;
}

export function isCandidateCompareRowEligibleForBenchmarks(
  row: CandidateCompareRow,
): boolean {
  const normalizedStatus = normalizeStatus(row.status);
  return (
    (normalizedStatus === 'completed' || normalizedStatus === 'evaluated') &&
    row.winoeReportStatus === 'ready'
  );
}

export function filterCandidateCompareRowsForTrial(
  rows: CandidateCompareRow[],
  trialId: string,
): CandidateCompareRow[] {
  return rows.filter((row) => isCandidateCompareRowForTrial(row, trialId));
}
