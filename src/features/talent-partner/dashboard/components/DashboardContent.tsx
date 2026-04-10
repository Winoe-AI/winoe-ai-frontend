import { ProfileCard } from './ProfileCard';
import { DashboardHeader } from './DashboardHeader';
import { TrialSection } from './TrialSection';
import type { TalentPartnerProfile } from '../types';
import type { TrialListItem } from '@/features/talent-partner/types';

const ProfileSkeleton = () => (
  <div className="rounded border border-gray-200 bg-white p-4 shadow-sm">
    <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
    <div className="mt-2 h-3 w-48 animate-pulse rounded bg-gray-100" />
  </div>
);

type Props = {
  profile: TalentPartnerProfile | null;
  error: string | null;
  profileLoading?: boolean;
  trials: TrialListItem[];
  trialsError: string | null;
  trialsLoading: boolean;
  onRefresh: () => void;
  onOpenInvite: (trial: TrialListItem) => void;
};

export function DashboardContent({
  profile,
  error,
  profileLoading = false,
  trials,
  trialsError,
  trialsLoading,
  onRefresh,
  onOpenInvite,
}: Props) {
  return (
    <main className="flex flex-col gap-4 py-8">
      <DashboardHeader />

      {profile ? (
        <ProfileCard
          companyName={profile.companyName}
          name={profile.name}
          email={profile.email}
          role={profile.role}
        />
      ) : null}

      {!profile && !error && profileLoading ? <ProfileSkeleton /> : null}

      {!profile && !profileLoading && error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : null}

      <TrialSection
        trials={trials}
        loading={trialsLoading}
        error={trialsError}
        onInvite={onOpenInvite}
        onRetry={onRefresh}
      />
    </main>
  );
}
