import type { CandidateInvite } from '@/features/candidate/session/api';
import { deriveCandidateInviteState } from '../utils/candidateInviteViewModel';

type Props = { invite: CandidateInvite };

export function InviteMeta({ invite }: Props) {
  const { currentDayLabel } = deriveCandidateInviteState(invite);
  const inviter = invite.talentPartnerName ?? invite.talentPartnerEmail ?? null;

  return (
    <div className="space-y-1">
      <div className="text-lg font-semibold text-gray-900">{invite.title}</div>
      <div className="text-sm text-gray-600">
        {invite.company ?? 'Company pending'}
        {invite.role ? ` • ${invite.role}` : null}
      </div>
      {inviter ? (
        <div className="text-sm text-gray-600">Talent Partner: {inviter}</div>
      ) : null}
      <div className="text-sm text-gray-600">
        Current day: {currentDayLabel}
      </div>
    </div>
  );
}
