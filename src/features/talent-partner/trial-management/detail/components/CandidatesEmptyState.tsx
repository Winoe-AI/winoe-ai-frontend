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
      title="No candidates invited yet."
      description="Invite candidates to start collecting real-work evidence for this Trial."
      action={
        <Button
          variant="secondary"
          size="sm"
          onClick={onInvite}
          disabled={!inviteEnabled}
          title={
            inviteEnabled ? undefined : (inviteDisabledReason ?? undefined)
          }
          data-testid="invite-candidates-empty-cta"
        >
          Invite candidates
        </Button>
      }
    />
  );
}
