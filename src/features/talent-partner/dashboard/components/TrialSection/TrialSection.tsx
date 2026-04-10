import { TalentPartnerTrialList } from '@/features/talent-partner/trial-management/list/TalentPartnerTrialList';
import { TrialError } from './TrialError';
import { TrialSkeleton } from './TrialSkeleton';
import type { TrialListItem } from '../../types';

type TrialSectionProps = {
  trials: TrialListItem[];
  loading: boolean;
  error: string | null;
  onInvite: (trial: TrialListItem) => void;
  onRetry?: () => void;
};

export function TrialSection({
  trials,
  loading,
  error,
  onInvite,
  onRetry,
}: TrialSectionProps) {
  const hasTrials = trials.length > 0;

  if (loading && !hasTrials) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Trials</h2>
        <TrialSkeleton />
      </section>
    );
  }

  if (!loading && error) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Trials</h2>
        <TrialError message={error} onRetry={onRetry} />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Trials</h2>

      {hasTrials ? (
        <div className="flex flex-col gap-1">
          {loading ? (
            <p className="text-xs text-gray-500">Refreshing…</p>
          ) : null}
          <TalentPartnerTrialList trials={trials} onInvite={onInvite} />
        </div>
      ) : (
        <TalentPartnerTrialList trials={trials} onInvite={onInvite} />
      )}
    </section>
  );
}
