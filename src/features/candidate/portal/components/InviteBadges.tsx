import { StatusPill } from '@/shared/ui/StatusPill';
import { formatShortDate } from '@/shared/formatters/date';
import type { CandidateInvite } from '@/features/candidate/session/api';
import { deriveCandidateInviteState } from '../utils/candidateInviteViewModel';

type Props = { invite: CandidateInvite };

export function InviteBadges({ invite }: Props) {
  const { statusLabel, statusTone } = deriveCandidateInviteState(invite);
  return (
    <div className="flex flex-wrap gap-3 text-xs text-gray-600">
      <StatusPill label={statusLabel} tone={statusTone} />
      {formatShortDate(invite.lastActivityAt) ? (
        <span>Last active: {formatShortDate(invite.lastActivityAt)}</span>
      ) : null}
      {formatShortDate(invite.expiresAt) ? (
        <span>Expires: {formatShortDate(invite.expiresAt)}</span>
      ) : null}
    </div>
  );
}
