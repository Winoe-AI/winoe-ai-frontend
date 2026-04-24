import Button from '@/shared/ui/Button';
import type { CandidateInvite } from '@/features/candidate/session/api';
import {
  deriveCandidateInviteState,
  isTerminatedInvite,
} from '../utils/candidateInviteViewModel';

type Props = {
  invite: CandidateInvite;
  fallbackToken: string | null;
  onContinue: (invite: CandidateInvite) => void;
  onIntent?: (invite: CandidateInvite) => void;
};

export function InviteActions({
  invite,
  fallbackToken,
  onContinue,
  onIntent,
}: Props) {
  const { actionLabel, actionDisabled } = deriveCandidateInviteState(invite);
  const tokenAvailable = invite.token || fallbackToken;
  const disabled =
    !tokenAvailable ||
    invite.isExpired ||
    isTerminatedInvite(invite) ||
    actionDisabled;

  return (
    <Button
      onClick={() => onContinue(invite)}
      disabled={disabled}
      className="w-full sm:w-auto"
      onMouseEnter={() => onIntent?.(invite)}
      onFocus={() => onIntent?.(invite)}
    >
      {actionLabel}
    </Button>
  );
}
