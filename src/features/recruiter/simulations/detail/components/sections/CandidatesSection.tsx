import { CandidatesTable } from '../CandidatesTable';
import { CandidateCompareSection } from '../CandidateCompareSection';
import { useSimulationCandidatesCompare } from '../../hooks/useSimulationCandidatesCompare';
import type { SimulationDetailViewProps } from '../types';

type Props = {
  loading: SimulationDetailViewProps['candidatesLoading'];
  error: SimulationDetailViewProps['candidatesError'];
  onRetry: SimulationDetailViewProps['reloadCandidates'];
  search: SimulationDetailViewProps['search'];
  candidates: SimulationDetailViewProps['candidates'];
  rowStates: SimulationDetailViewProps['rowStates'];
  onCopy: SimulationDetailViewProps['onCopy'];
  onResend: SimulationDetailViewProps['onResend'];
  onCloseManual: SimulationDetailViewProps['onCloseManual'];
  cooldownNow: SimulationDetailViewProps['cooldownNow'];
  simulationId: SimulationDetailViewProps['simulationId'];
  inviteEnabled: SimulationDetailViewProps['inviteEnabled'];
  inviteDisabledReason: SimulationDetailViewProps['inviteDisabledReason'];
  inviteResendEnabled: SimulationDetailViewProps['inviteResendEnabled'];
  inviteResendDisabledReason: SimulationDetailViewProps['inviteResendDisabledReason'];
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
  simulationId,
  inviteEnabled,
  inviteDisabledReason,
  inviteResendEnabled,
  inviteResendDisabledReason,
  onInvite,
}: Props) {
  const compareEnabled = !loading && !error && candidates.length > 0;
  const {
    rows: compareRows,
    loading: compareLoading,
    error: compareError,
    generatingIds,
    reload: reloadCompare,
    generateFitProfile,
  } = useSimulationCandidatesCompare({
    simulationId,
    enabled: compareEnabled,
  });

  return (
    <div className="flex flex-col gap-4">
      <CandidateCompareSection
        simulationId={simulationId}
        candidateCount={candidates.length}
        candidatesLoading={loading}
        compareLoading={compareLoading}
        compareError={compareError}
        rows={compareRows}
        generatingIds={generatingIds}
        onRetry={reloadCompare}
        onGenerate={generateFitProfile}
      />
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
        simulationId={simulationId}
        onInvite={onInvite}
        inviteEnabled={inviteEnabled}
        inviteDisabledReason={inviteDisabledReason}
        inviteResendEnabled={inviteResendEnabled}
        inviteResendDisabledReason={inviteResendDisabledReason}
      />
    </div>
  );
}
