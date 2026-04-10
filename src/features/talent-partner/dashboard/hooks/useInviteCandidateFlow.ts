import { useCallback, useState } from 'react';
import { inviteCandidate } from '@/features/talent-partner/api';
import { formatTalentPartnerError } from '../../utils/formattersUtils';
import { friendlyInviteError, toSafeString } from '../utils/inviteHelpersUtils';
import type {
  InviteModalState,
  InviteSuccess,
} from '@/features/talent-partner/types';

export function useInviteCandidateFlow(trial: InviteModalState | null) {
  const [state, setState] = useState<{
    status: 'idle' | 'loading' | 'error';
    message?: string;
  }>({ status: 'idle' });

  const submit = useCallback(
    async (
      candidateName: string,
      inviteEmail: string,
    ): Promise<InviteSuccess | null> => {
      const safeTrialId = toSafeString(trial?.trialId).trim();
      if (!safeTrialId) return null;

      const safeName = toSafeString(candidateName).trim();
      const safeEmail = toSafeString(inviteEmail).trim().toLowerCase();
      if (!safeName || !safeEmail) {
        setState({
          status: 'error',
          message: 'Candidate name and email are required.',
        });
        return null;
      }
      setState({ status: 'loading' });
      try {
        const res = await inviteCandidate(safeTrialId, safeName, safeEmail);

        setState({ status: 'idle' });
        return {
          inviteUrl: res.inviteUrl,
          outcome: res.outcome,
          trialId: safeTrialId,
          candidateName: safeName,
          candidateEmail: safeEmail,
        };
      } catch (e: unknown) {
        const friendlyMessage = friendlyInviteError(e);
        setState({
          status: 'error',
          message:
            friendlyMessage ??
            formatTalentPartnerError(e, 'Failed to invite candidate.'),
        });
        return null;
      }
    },
    [trial],
  );

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { state, submit, reset };
}
