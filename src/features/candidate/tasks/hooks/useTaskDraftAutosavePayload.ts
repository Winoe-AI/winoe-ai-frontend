import type { CandidateTaskDraftPayload } from '@/features/candidate/session/api/taskDraftsApi';

export function normalizePayload(
  payload: CandidateTaskDraftPayload,
): CandidateTaskDraftPayload {
  const normalized: CandidateTaskDraftPayload = {};
  if (payload.contentText !== undefined) {
    normalized.contentText =
      typeof payload.contentText === 'string' ? payload.contentText : null;
  }
  if (payload.contentJson !== undefined) {
    normalized.contentJson = payload.contentJson
      ? { ...payload.contentJson }
      : null;
  }
  return normalized;
}

export function payloadFingerprint(payload: CandidateTaskDraftPayload): string {
  return JSON.stringify({
    contentText: payload.contentText ?? null,
    contentJson: payload.contentJson ?? null,
  });
}
