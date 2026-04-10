import { CandidatesTable } from '../CandidatesTable';
import type { TrialDetailViewProps } from '../types';
import {
  CandidateCompareSlotComponent,
  ComparePreparingState,
} from './CandidateCompareSlotLoader';
import { useDeferredCompareSlot } from './useDeferredCompareSlot';

export type CandidatesSectionProps = {
  loading: TrialDetailViewProps['candidatesLoading'];
  error: TrialDetailViewProps['candidatesError'];
  onRetry: TrialDetailViewProps['reloadCandidates'];
  search: TrialDetailViewProps['search'];
  candidates: TrialDetailViewProps['candidates'];
  rowStates: TrialDetailViewProps['rowStates'];
  onCopy: TrialDetailViewProps['onCopy'];
  onResend: TrialDetailViewProps['onResend'];
  onCloseManual: TrialDetailViewProps['onCloseManual'];
  cooldownNow: TrialDetailViewProps['cooldownNow'];
  trialId: TrialDetailViewProps['trialId'];
  inviteEnabled: TrialDetailViewProps['inviteEnabled'];
  inviteDisabledReason: TrialDetailViewProps['inviteDisabledReason'];
  inviteResendEnabled: TrialDetailViewProps['inviteResendEnabled'];
  inviteResendDisabledReason: TrialDetailViewProps['inviteResendDisabledReason'];
  onInvite: () => void;
};

export function CandidatesSection({
  loading,
  error,
  onRetry,
  search,
  candidates,
  rowStates,
  onCopy,
  onResend,
  onCloseManual,
  cooldownNow,
  trialId,
  inviteEnabled,
  inviteDisabledReason,
  inviteResendEnabled,
  inviteResendDisabledReason,
  onInvite,
}: CandidatesSectionProps) {
  const compareEnabled = !loading && !error && candidates.length > 0;
  const showCompareSlot = useDeferredCompareSlot(compareEnabled);

  return (
    <div className="flex flex-col gap-4">
      {showCompareSlot ? (
        <CandidateCompareSlotComponent
          trialId={trialId}
          candidateCount={candidates.length}
          candidatesLoading={loading}
          enabled={compareEnabled}
        />
      ) : (
        <ComparePreparingState />
      )}
      <CandidatesTable
        loading={loading}
        error={error}
        onRetry={onRetry}
        search={search.search}
        setSearch={search.setSearch}
        pagedCandidates={search.pagedCandidates}
        visibleCount={search.visibleCandidates.length}
        totalCount={candidates.length}
        page={search.page}
        pageCount={search.pageCount}
        setPage={search.setPage}
        rowStates={rowStates}
        onCopy={onCopy}
        onResend={onResend}
        onCloseManual={(id) => onCloseManual(String(id))}
        cooldownNow={cooldownNow}
        trialId={trialId}
        onInvite={onInvite}
        inviteEnabled={inviteEnabled}
        inviteDisabledReason={inviteDisabledReason}
        inviteResendEnabled={inviteResendEnabled}
        inviteResendDisabledReason={inviteResendDisabledReason}
      />
    </div>
  );
}
