'use client';
import dynamic from 'next/dynamic';
import { TerminateTrialModal } from './TerminateTrialModal';
import type { TrialDetailViewProps } from './types';

const TrialInviteModal = dynamic(
  () => import('./TrialInviteModal').then((mod) => mod.TrialInviteModal),
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

type TrialDetailModalsProps = {
  props: TrialDetailViewProps;
  closeInviteModal: () => void;
};

export function TrialDetailModals({
  props,
  closeInviteModal,
}: TrialDetailModalsProps) {
  return (
    <>
      {props.inviteModalOpen ? (
        <TrialInviteModal
          trialId={props.trialId}
          open={props.inviteModalOpen}
          inviteFlowState={props.inviteFlowState}
          onClose={closeInviteModal}
          onSubmit={props.submitInvite}
        />
      ) : null}

      {props.terminateModalOpen ? (
        <TerminateTrialModal
          open={props.terminateModalOpen}
          pending={props.terminatePending}
          onClose={() => props.setTerminateModalOpen(false)}
          onConfirm={props.onTerminate}
        />
      ) : null}
    </>
  );
}
