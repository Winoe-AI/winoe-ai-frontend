'use client';
import { StatusPill } from '@/shared/ui/StatusPill';
import { formatCooldown } from '../utils/formatters';
import type { RowState } from '../hooks/types';
import { ManualInviteLink } from './ManualInviteLink';

type CandidateInviteStatusMessagesProps = {
  candidateSessionId: number;
  rowState: RowState;
  inviteLink: string | null;
  inviteResendEnabled: boolean;
  inviteResendDisabledReason: string | null;
  cooldownActive: boolean;
  cooldownRemainingMs: number | null;
  onCloseManual: (id: number) => void;
};

export function CandidateInviteStatusMessages({
  candidateSessionId,
  rowState,
  inviteLink,
  inviteResendEnabled,
  inviteResendDisabledReason,
  cooldownActive,
  cooldownRemainingMs,
  onCloseManual,
}: CandidateInviteStatusMessagesProps) {
  return (
    <>
      {!inviteResendEnabled && inviteResendDisabledReason ? (
        <div className="text-xs text-gray-600">{inviteResendDisabledReason}</div>
      ) : null}
      {!inviteLink ? (
        <div className="text-xs text-gray-600">
          Invite link unavailable — resend invite or refresh.
        </div>
      ) : null}
      {rowState.manualCopyOpen && rowState.manualCopyUrl ? (
        <ManualInviteLink
          url={rowState.manualCopyUrl}
          onClose={() => onCloseManual(candidateSessionId)}
        />
      ) : null}
      {cooldownActive ? (
        <div className="text-xs text-gray-600">
          {cooldownRemainingMs
            ? formatCooldown(cooldownRemainingMs)
            : 'Rate limited — try again soon'}
        </div>
      ) : null}
      {rowState.error ? <div className="text-xs text-red-600">{rowState.error}</div> : null}
      {rowState.message ? <StatusPill label={rowState.message} tone="success" /> : null}
    </>
  );
}
