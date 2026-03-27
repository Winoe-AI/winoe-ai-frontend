import { CandidatesSection } from './sections/CandidatesSection';
import type { SimulationDetailViewProps } from './types';

type SimulationDetailCandidatesPanelProps = {
  props: SimulationDetailViewProps;
  onInvite: () => void;
};

export function SimulationDetailCandidatesPanel({
  props,
  onInvite,
}: SimulationDetailCandidatesPanelProps) {
  return (
    <CandidatesSection
      loading={props.candidatesLoading}
      error={props.candidatesError}
      onRetry={props.reloadCandidates}
      search={props.search}
      candidates={props.candidates}
      rowStates={props.rowStates}
      onCopy={props.onCopy}
      onResend={props.onResend}
      onCloseManual={props.onCloseManual}
      cooldownNow={props.cooldownNow}
      simulationId={props.simulationId}
      inviteEnabled={props.inviteEnabled}
      inviteDisabledReason={props.inviteDisabledReason}
      onInvite={onInvite}
      inviteResendEnabled={props.inviteResendEnabled}
      inviteResendDisabledReason={props.inviteResendDisabledReason}
    />
  );
}
