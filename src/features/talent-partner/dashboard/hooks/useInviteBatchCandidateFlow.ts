import { useCallback, useState } from 'react';
import { inviteCandidatesBatch } from '@/features/talent-partner/api/invitesBatchApi';
import { formatTalentPartnerError } from '../../utils/formattersUtils';
import { friendlyInviteError, toSafeString } from '../utils/inviteHelpersUtils';
import type { InviteModalState } from '@/features/talent-partner/types';
import type {
  InviteBatchUiState,
  InviteCandidateRow,
} from '@/features/talent-partner/trial-management/invitations/InviteBatchCandidateTypes';

export function useInviteBatchCandidateFlow(trial: InviteModalState | null) {
  const [state, setState] = useState<InviteBatchUiState>({ status: 'idle' });

  const submit = useCallback(
    async (rows: InviteCandidateRow[]): Promise<boolean> => {
      const safeTrialId = toSafeString(trial?.trialId).trim();
      if (!safeTrialId) return false;
      const cleaned = rows
        .map((r) => ({
          name: toSafeString(r.name).trim(),
          email: toSafeString(r.email).trim().toLowerCase(),
        }))
        .filter((r) => r.name && r.email);
      if (!cleaned.length) {
        setState({
          status: 'error',
          message: 'Add at least one candidate with name and email.',
        });
        return false;
      }
      setState({ status: 'loading' });
      try {
        const { invites } = await inviteCandidatesBatch(safeTrialId, cleaned);
        const ok = invites.filter((i) => i.status !== 'failed');
        const failed = invites.filter((i) => i.status === 'failed');
        const nOk = ok.length;
        const nFail = failed.length;
        let message: string;
        if (nFail === 0) {
          message = `${nOk} invite${nOk === 1 ? '' : 's'} sent. Each candidate received a unique link. You can also copy the links below.`;
        } else if (nOk === 0) {
          message = `No invites were sent (${nFail} failed). Review the errors below.`;
        } else {
          message = `${nOk} invite${nOk === 1 ? '' : 's'} sent; ${nFail} failed. Review errors below.`;
        }
        setState({
          status: 'success',
          message,
          invites,
        });
        return true;
      } catch (e: unknown) {
        const friendlyMessage = friendlyInviteError(e);
        setState({
          status: 'error',
          message:
            friendlyMessage ??
            formatTalentPartnerError(e, 'Failed to send invites.'),
        });
        return false;
      }
    },
    [trial],
  );

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { state, submit, reset, setState };
}
