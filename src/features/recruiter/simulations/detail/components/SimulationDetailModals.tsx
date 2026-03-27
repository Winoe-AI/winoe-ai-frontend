'use client';
import dynamic from 'next/dynamic';
import { TerminateSimulationModal } from './TerminateSimulationModal';
import type { SimulationDetailViewProps } from './types';

const SimulationInviteModal = dynamic(
  () =>
    import('./SimulationInviteModal').then((mod) => mod.SimulationInviteModal),
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

type SimulationDetailModalsProps = {
  props: SimulationDetailViewProps;
  closeInviteModal: () => void;
};

export function SimulationDetailModals({
  props,
  closeInviteModal,
}: SimulationDetailModalsProps) {
  return (
    <>
      {props.inviteModalOpen ? (
        <SimulationInviteModal
          simulationId={props.simulationId}
          open={props.inviteModalOpen}
          inviteFlowState={props.inviteFlowState}
          onClose={closeInviteModal}
          onSubmit={props.submitInvite}
        />
      ) : null}

      {props.terminateModalOpen ? (
        <TerminateSimulationModal
          open={props.terminateModalOpen}
          pending={props.terminatePending}
          onClose={() => props.setTerminateModalOpen(false)}
          onConfirm={props.onTerminate}
        />
      ) : null}
    </>
  );
}
