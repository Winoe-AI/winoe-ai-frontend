'use client';
import { TerminateTrialModal } from './TerminateTrialModal';
import { TrialInviteModal } from './TrialInviteModal';
import type { TrialDetailViewProps } from './types';

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
