'use client';
import { useNotifications } from '@/shared/notifications';
import type { CandidateSession } from '@/features/recruiter/types';
import { useCandidateRowState } from './useCandidateRowState';
import { useInviteCopyActions } from './useInviteCopyActions';
import { useResendInviteAction } from './useResendInviteAction';

export function useCandidateRowActions(
  simulationId: string,
  refresh: () => void,
  updateLocal: (
    updater: (prev: CandidateSession[]) => CandidateSession[],
  ) => void,
  inviteResendEnabled: boolean,
  inviteResendDisabledReason: string | null,
) {
  const { notify } = useNotifications();
  const { rows, updateRow } = useCandidateRowState(simulationId);
  const { handleCopy, closeManualCopy } = useInviteCopyActions(
    updateRow,
    notify,
  );
  const { handleResend } = useResendInviteAction(
    simulationId,
    updateRow,
    refresh,
    updateLocal,
    notify,
    inviteResendEnabled,
    inviteResendDisabledReason,
  );

  return { rowStates: rows, handleCopy, handleResend, closeManualCopy };
}
