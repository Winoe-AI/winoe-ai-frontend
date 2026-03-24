import { useEffect, useState, type ComponentType } from 'react';
import dynamic from 'next/dynamic';
import { CandidatesTable } from '../CandidatesTable';
import type { CandidateCompareSlotProps } from './CandidateCompareSlot';
import type { SimulationDetailViewProps } from '../types';

const LazyCandidateCompareSlot = dynamic<CandidateCompareSlotProps>(
  () =>
    import('./CandidateCompareSlot').then((mod) => mod.CandidateCompareSlot),
  {
    ssr: false,
    loading: () => (
      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-600">Loading candidate comparison...</p>
      </section>
    ),
  },
);

let CandidateCompareSlotComponent: ComponentType<CandidateCompareSlotProps> =
  LazyCandidateCompareSlot;

if (process.env.NODE_ENV === 'test') {
  const candidateCompareModule =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('./CandidateCompareSlot') as typeof import('./CandidateCompareSlot');
  CandidateCompareSlotComponent = candidateCompareModule.CandidateCompareSlot;
}

const DEFERRED_COMPARE_DELAY_MS = process.env.NODE_ENV === 'test' ? 0 : 550;

type WindowWithIdleCallbacks = Window & {
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions,
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

export type CandidatesSectionProps = {
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
}: CandidatesSectionProps) {
  const compareEnabled = !loading && !error && candidates.length > 0;
  const [showCompareSlot, setShowCompareSlot] = useState(
    DEFERRED_COMPARE_DELAY_MS === 0 || !compareEnabled,
  );

  useEffect(() => {
    if (DEFERRED_COMPARE_DELAY_MS === 0 || !compareEnabled || showCompareSlot) {
      return;
    }
    let idleId: number | null = null;

    const timer = window.setTimeout(() => {
      const hostWindow = window as WindowWithIdleCallbacks;
      if (typeof hostWindow.requestIdleCallback === 'function') {
        idleId = hostWindow.requestIdleCallback(
          () => setShowCompareSlot(true),
          { timeout: 1000 },
        );
        return;
      }
      setShowCompareSlot(true);
    }, DEFERRED_COMPARE_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      if (idleId !== null) {
        (window as WindowWithIdleCallbacks).cancelIdleCallback?.(idleId);
      }
    };
  }, [compareEnabled, showCompareSlot]);

  return (
    <div className="flex flex-col gap-4">
      {showCompareSlot ? (
        <CandidateCompareSlotComponent
          simulationId={simulationId}
          candidateCount={candidates.length}
          candidatesLoading={loading}
          enabled={compareEnabled}
        />
      ) : (
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-600">
            Preparing candidate comparison...
          </p>
        </section>
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
