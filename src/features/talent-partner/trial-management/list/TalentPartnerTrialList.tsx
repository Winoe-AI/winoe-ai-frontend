'use client';

import Link from 'next/link';
import Button from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import type { TrialListItem } from '@/features/talent-partner/api';
import { TrialListRow } from './TrialListRow';
import { LINK_PREFETCH, useTrialListPrefetch } from './trialListPrefetch';

type TalentPartnerTrialListProps = {
  trials: TrialListItem[];
  onInvite: (trial: TrialListItem) => void;
};

export function TalentPartnerTrialList({
  trials,
  onInvite,
}: TalentPartnerTrialListProps) {
  const prefetchTrial = useTrialListPrefetch(trials);

  if (!trials.length) {
    return (
      <EmptyState
        title="No trials yet"
        description="Kick off a trial to invite candidates and track their progress."
        action={
          <Link href="/dashboard/trials/new" prefetch={LINK_PREFETCH}>
            <Button>New Trial</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="rounded border border-gray-200">
      <div className="grid grid-cols-12 gap-3 border-b border-gray-200 bg-gray-50 p-3 text-xs font-medium uppercase tracking-wide text-gray-500">
        <div className="col-span-4">Title</div>
        <div className="col-span-3">Role</div>
        <div className="col-span-3">Created</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {trials.map((trial) => (
        <TrialListRow
          key={trial.id}
          trial={trial}
          onInvite={onInvite}
          onPrefetch={prefetchTrial}
        />
      ))}
    </div>
  );
}
