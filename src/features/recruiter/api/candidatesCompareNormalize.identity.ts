import { asRecord } from './candidatesCompareNormalize.records';
import { sanitizeText } from './candidatesCompareNormalize.text';

export function parseCandidateIdentity(record: Record<string, unknown>): {
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
