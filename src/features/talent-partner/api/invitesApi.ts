import { normalizeInviteResponse } from './inviteNormalizeResponseApi';
import { requestTalentPartnerBff } from './requestTalentPartnerBffApi';
import { safeId } from './trialUtilsApi';
import { throwMappedApiError } from '@/platform/api-client/errors/errorMapping';
import type { InviteCandidateResponse } from './typesApi';

export async function inviteCandidate(
  trialId: string,
  candidateName: string,
  inviteEmail: string,
): Promise<InviteCandidateResponse> {
  const trim = (value: unknown) =>
    typeof value === 'string' || typeof value === 'number'
      ? String(value).trim()
      : '';
  const id = trim(trialId);
  const name = trim(candidateName);
  const email = trim(inviteEmail).toLowerCase();

  if (!id || !name || !email) {
    return {
      candidateSessionId: '',
      token: '',
      inviteUrl: '',
      outcome: 'created',
    };
  }

  try {
    const { data } = await requestTalentPartnerBff<unknown>(
      `/trials/${id}/invite`,
      {
        method: 'POST',
        body: { candidateName: name, inviteEmail: email },
      },
    );
    return normalizeInviteResponse(data, buildInviteUrl);
  } catch (error) {
    throwMappedApiError(error, 'Unable to send invite.', 'talent_partner');
  }
}

export async function resendInvite(
  trialId: string | number,
  candidateSessionId: number,
): Promise<unknown> {
  const id = safeId(trialId);
  const candidateId = Number.isFinite(candidateSessionId)
    ? String(candidateSessionId)
    : '';
  if (!id || !candidateId) return null;

  const { data } = await requestTalentPartnerBff(
    `/trials/${encodeURIComponent(id)}/candidates/${encodeURIComponent(candidateId)}/invite/resend`,
    { method: 'POST' },
  );
  return data;
}

function buildInviteUrl(token: string) {
  const path = `/candidate/session/${token}`;
  if (typeof window === 'undefined' || !window.location?.origin) return path;
  return `${window.location.origin}${path}`;
}
