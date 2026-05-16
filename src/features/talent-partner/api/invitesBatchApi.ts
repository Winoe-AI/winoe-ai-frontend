import { requestTalentPartnerBff } from './requestTalentPartnerBffApi';
import { safeId } from './trialUtilsApi';
import { throwMappedApiError } from '@/platform/api-client/errors/errorMapping';

export type InviteCandidateRowInput = { name: string; email: string };

export type TrialInviteResultItem = {
  candidateSessionId: string;
  name: string;
  email: string;
  inviteUrl: string;
  status: 'sent' | 'resent' | 'failed';
  errorCode?: string | null;
  errorMessage?: string | null;
  workspaceProvisioningStatus?: string | null;
  workspaceProvisioningNotice?: string | null;
};

export async function inviteCandidatesBatch(
  trialId: string,
  candidates: InviteCandidateRowInput[],
): Promise<{ invites: TrialInviteResultItem[] }> {
  const id = safeId(trialId);
  if (!id) {
    throw new Error('Trial ID is required.');
  }
  try {
    const { data } = await requestTalentPartnerBff<{
      invites?: Array<{
        candidateSessionId?: number | null;
        name?: string;
        email?: string;
        inviteUrl?: string;
        status?: string;
        errorCode?: string | null;
        errorMessage?: string | null;
      }>;
    }>(`/trials/${encodeURIComponent(id)}/invite-candidates`, {
      method: 'POST',
      body: {
        candidates: candidates.map((c) => ({
          name: c.name.trim(),
          email: c.email.trim().toLowerCase(),
        })),
      },
    });
    const raw = Array.isArray(data?.invites) ? data.invites : [];
    const invites: TrialInviteResultItem[] = raw.map((row) => ({
      candidateSessionId: String(row.candidateSessionId ?? ''),
      name: String(row.name ?? ''),
      email: String(row.email ?? ''),
      inviteUrl: String(row.inviteUrl ?? ''),
      status:
        row.status === 'resent'
          ? 'resent'
          : row.status === 'failed'
            ? 'failed'
            : 'sent',
      errorCode: row.errorCode ?? null,
      errorMessage: row.errorMessage ?? null,
      workspaceProvisioningStatus:
        (row as { workspaceProvisioningStatus?: string | null })
          .workspaceProvisioningStatus ?? null,
      workspaceProvisioningNotice:
        (row as { workspaceProvisioningNotice?: string | null })
          .workspaceProvisioningNotice ?? null,
    }));
    return { invites };
  } catch (error) {
    throwMappedApiError(
      error,
      'Unable to send invites. Check Trial status and try again.',
      'talent_partner',
    );
  }
}
