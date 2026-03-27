import Button from '@/shared/ui/Button';
import type { CandidateInvite } from '@/features/candidate/session/api';

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
  const tokenAvailable = invite.token || fallbackToken;
  const disabled = !tokenAvailable || invite.isExpired;
  const label =
    invite.status === 'not_started' ? 'Start simulation' : 'Continue';

  return (
    <Button
      onClick={() => onContinue(invite)}
      disabled={disabled}
      className="w-full sm:w-auto"
      onMouseEnter={() => onIntent?.(invite)}
      onFocus={() => onIntent?.(invite)}
    >
      {label}
    </Button>
  );
}
