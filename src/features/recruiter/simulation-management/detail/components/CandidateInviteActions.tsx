'use client';
import Button from '@/shared/ui/Button';
import type { CandidateSession } from '@/features/recruiter/types';
import type { RowState } from '../hooks/useTypes';
import { CandidateInviteStatusMessages } from './CandidateInviteStatusMessages';

type Props = {
  candidate: CandidateSession;
  rowState: RowState;
  inviteLink: string | null;
  cooldownNow: number;
  inviteResendEnabled: boolean;
  inviteResendDisabledReason: string | null;
  onCopy: (candidate: CandidateSession) => void;
  onResend: (candidate: CandidateSession) => void;
  onCloseManual: (id: number) => void;
};

export function CandidateInviteActions({
  candidate,
  rowState,
  inviteLink,
  cooldownNow,
  inviteResendEnabled,
  inviteResendDisabledReason,
  onCopy,
  onResend,
  onCloseManual,
}: Props) {
  const cooldownActive =
    typeof rowState.cooldownUntilMs === 'number' &&
    rowState.cooldownUntilMs > cooldownNow;
  const cooldownRemainingMs = cooldownActive
    ? Math.max(0, (rowState.cooldownUntilMs ?? 0) - cooldownNow)
    : null;
  const resendDisabled =
    rowState.resending || cooldownActive || !inviteResendEnabled;
  const copyDisabled =
    rowState.resending || !inviteLink || !inviteResendEnabled;
  const resendDisabledTitle = inviteResendEnabled
    ? undefined
    : (inviteResendDisabledReason ?? undefined);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onCopy(candidate)}
          disabled={copyDisabled}
          title={resendDisabledTitle}
        >
          {rowState.copied ? 'Copied' : 'Copy invite link'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onResend(candidate)}
          disabled={resendDisabled}
          title={resendDisabledTitle}
        >
          {rowState.resending ? 'Resending…' : 'Resend invite'}
        </Button>
      </div>
      <CandidateInviteStatusMessages
        candidateSessionId={candidate.candidateSessionId}
        rowState={rowState}
        inviteLink={inviteLink}
        inviteResendEnabled={inviteResendEnabled}
        inviteResendDisabledReason={inviteResendDisabledReason}
        cooldownActive={cooldownActive}
        cooldownRemainingMs={cooldownRemainingMs}
        onCloseManual={onCloseManual}
      />
    </div>
  );
}
