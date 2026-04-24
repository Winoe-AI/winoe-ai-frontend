import type { CandidateInvite } from '@/features/candidate/session/api';
import { isTerminatedInvite } from '../utils/candidateInviteViewModel';

type Props = {
  invite: CandidateInvite;
  tokenAvailable: boolean;
};

export function InviteWarnings({ invite, tokenAvailable }: Props) {
  if (isTerminatedInvite(invite)) {
    return (
      <div className="mt-3 text-xs text-amber-700">
        This trial has ended. Please contact your Talent Partner for next steps.
      </div>
    );
  }

  if (invite.isExpired) {
    return (
      <div className="mt-3 text-xs text-amber-700">
        This invite has expired. Please contact your Talent Partner for a new
        link.
      </div>
    );
  }

  if (!tokenAvailable) {
    return (
      <div className="mt-3 text-xs text-amber-700">
        Invite link unavailable. We’ll keep this saved; please open your most
        recent invite email to resume.
      </div>
    );
  }

  return null;
}
