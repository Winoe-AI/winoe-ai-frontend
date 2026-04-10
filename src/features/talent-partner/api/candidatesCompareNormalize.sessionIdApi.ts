import { toNumberOrNull, toStringOrNull } from './trialUtilsApi';

export function resolveCandidateSessionId(
  record: Record<string, unknown>,
): string {
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
