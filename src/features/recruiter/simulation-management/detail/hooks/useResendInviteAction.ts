import { useCallback } from 'react';
import type { CandidateSession } from '@/features/recruiter/types';
import type { Notify, UpdateRow } from './useResendInviteTypes';
import { fetchResendOutcome } from './useResendInviteService';
import { finishRow, handleOutcome, markPending } from './useResendInviteState';
import { notifyError, notifySuccess } from './useResendInviteNotifications';
import { useInviteCooldown } from './useInviteCooldown';

export function useResendInviteAction(
  simulationId: string,
  updateRow: UpdateRow,
  refresh: () => void,
  updateLocal: (
    updater: (prev: CandidateSession[]) => CandidateSession[],
  ) => void,
  notify: Notify,
  inviteResendEnabled: boolean,
  inviteResendDisabledReason: string | null,
) {
  const startCooldown = useInviteCooldown(updateRow);

  const handleResend = useCallback(
    async (candidate: CandidateSession) => {
      const id = String(candidate.candidateSessionId);
      if (!inviteResendEnabled) {
        const message =
          inviteResendDisabledReason ??
          'Invites and resends are disabled for this simulation.';
        finishRow(updateRow, id, { resending: false, error: message });
        notifyError(notify, id, message);
        return false;
      }

      markPending(updateRow, id);
      try {
        const outcome = await fetchResendOutcome(simulationId, candidate);
        const ok = handleOutcome(outcome, {
          id,
          updateRow,
          startCooldown,
          finish: (rowId, patch) => finishRow(updateRow, rowId, patch),
          refresh,
          updateLocal,
        });
        if (outcome.type === 'error') {
          notifyError(notify, id, outcome.message);
        } else if (ok) {
          notifySuccess(notify, id);
        }
        return ok;
      } catch (err) {
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Unable to resend invite.';
        finishRow(updateRow, id, { resending: false, error: message });
        notifyError(notify, id, message);
        return false;
      }
    },
    [
      inviteResendDisabledReason,
      inviteResendEnabled,
      notify,
      refresh,
      simulationId,
      startCooldown,
      updateLocal,
      updateRow,
    ],
  );

  return { handleResend };
}
