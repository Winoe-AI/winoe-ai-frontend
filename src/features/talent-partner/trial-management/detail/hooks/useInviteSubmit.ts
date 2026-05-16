import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { CandidateSession } from '@/features/talent-partner/types';
import type { InviteBatchUiState } from '@/features/talent-partner/trial-management/invitations/InviteBatchCandidateTypes';
import type { InviteCandidateRow } from '@/features/talent-partner/trial-management/invitations/InviteBatchCandidateTypes';

type InviteFlow = {
  submit: (rows: InviteCandidateRow[]) => Promise<boolean>;
  setState: Dispatch<SetStateAction<InviteBatchUiState>>;
};

type Params = {
  inviteFlow: InviteFlow;
  reload: () => Promise<CandidateSession[]>;
};

export function useInviteSubmit({ inviteFlow, reload }: Params) {
  return useCallback(
    async (rows: InviteCandidateRow[]) => {
      const ok = await inviteFlow.submit(rows);
      if (!ok) return;
      await reload().catch(() => [] as CandidateSession[]);
    },
    [inviteFlow, reload],
  );
}
