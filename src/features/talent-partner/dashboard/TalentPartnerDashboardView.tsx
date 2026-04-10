'use client';

import dynamic from 'next/dynamic';
import type { TalentPartnerProfile } from './types';
import type { TrialListItem } from '@/features/talent-partner/types';
import { DashboardContent } from './components/DashboardContent';
import { useDashboardInvites } from './hooks/useDashboardInvites';

const InviteCandidateModal = dynamic(
  () =>
    import('@/features/talent-partner/trial-management/invitations/InviteCandidateModal').then(
      (mod) => mod.InviteCandidateModal,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
        <div className="rounded bg-white px-4 py-3 text-sm text-gray-700 shadow">
          Loading invite form…
        </div>
      </div>
    ),
  },
);

type TalentPartnerDashboardViewProps = {
  profile: TalentPartnerProfile | null;
  error: string | null;
  profileLoading?: boolean;
  trials: TrialListItem[];
  trialsError: string | null;
  trialsLoading: boolean;
  onRefresh: () => void;
};

export default function TalentPartnerDashboardView({
  profile,
  error,
  profileLoading = false,
  trials,
  trialsError,
  trialsLoading,
  onRefresh,
}: TalentPartnerDashboardViewProps) {
  const { modal, modalState, inviteWho, openInvite, closeModal, submitInvite } =
    useDashboardInvites({ onRefresh });

  return (
    <>
      <DashboardContent
        profile={profile}
        error={error}
        profileLoading={profileLoading}
        trials={trials}
        trialsError={trialsError}
        trialsLoading={trialsLoading}
        onRefresh={onRefresh}
        onOpenInvite={(trial) => openInvite(trial.id, trial.title)}
      />
      {modal.open ? (
        <InviteCandidateModal
          open={modal.open}
          title={inviteWho}
          state={modalState}
          onClose={closeModal}
          onSubmit={submitInvite}
          initialName=""
          initialEmail=""
        />
      ) : null}
    </>
  );
}
