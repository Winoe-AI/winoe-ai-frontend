import type { CandidateInvite } from '@/features/candidate/session/api';

type Props = { invite: CandidateInvite };

export function InviteMeta({ invite }: Props) {
  const inviter = invite.talentPartnerName ?? invite.talentPartnerEmail ?? null;

  return (
    <div className="space-y-1">
      <div className="text-lg font-semibold text-gray-900">{invite.title}</div>
      <div className="text-sm text-gray-600">
        {invite.role}
        {invite.company ? ` • ${invite.company}` : null}
      </div>
      {inviter ? (
        <div className="text-sm text-gray-600">Invited by {inviter}</div>
      ) : null}
    </div>
  );
}
