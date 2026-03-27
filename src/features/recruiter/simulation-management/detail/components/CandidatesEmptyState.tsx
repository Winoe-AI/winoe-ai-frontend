'use client';

import { EmptyState } from '@/shared/ui/EmptyState';
import Button from '@/shared/ui/Button';

type Props = {
  onInvite: () => void;
  inviteEnabled: boolean;
  inviteDisabledReason: string | null;
};

export function CandidatesEmptyState({
  onInvite,
  inviteEnabled,
  inviteDisabledReason,
}: Props) {
  return (
    <EmptyState
      title="No candidates yet"
      description="Invite candidates to this simulation to track their progress and submissions."
      action={
        <Button
          variant="secondary"
          size="sm"
          onClick={onInvite}
          disabled={!inviteEnabled}
          title={
            inviteEnabled ? undefined : (inviteDisabledReason ?? undefined)
          }
        >
          Invite your first candidate
        </Button>
      }
    />
  );
}
