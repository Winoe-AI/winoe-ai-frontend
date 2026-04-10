import { CandidatesSection } from './sections/CandidatesSection';
import type { TrialDetailViewProps } from './types';

type TrialDetailCandidatesPanelProps = {
  props: TrialDetailViewProps;
  onInvite: () => void;
};

export function TrialDetailCandidatesPanel({
  props,
  onInvite,
}: TrialDetailCandidatesPanelProps) {
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
      trialId={props.trialId}
      inviteEnabled={props.inviteEnabled}
      inviteDisabledReason={props.inviteDisabledReason}
      onInvite={onInvite}
      inviteResendEnabled={props.inviteResendEnabled}
      inviteResendDisabledReason={props.inviteResendDisabledReason}
    />
  );
}
