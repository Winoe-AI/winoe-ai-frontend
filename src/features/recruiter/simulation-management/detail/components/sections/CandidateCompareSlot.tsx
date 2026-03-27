'use client';

import { CandidateCompareSection } from '../CandidateCompareSection';
import { useSimulationCandidatesCompare } from '../../hooks/useSimulationCandidatesCompare';

export type CandidateCompareSlotProps = {
  simulationId: string;
  candidateCount: number;
  candidatesLoading: boolean;
  enabled: boolean;
};

export function CandidateCompareSlot({
  simulationId,
  candidateCount,
  candidatesLoading,
  enabled,
}: CandidateCompareSlotProps) {
  const {
    rows: compareRows,
    loading: compareLoading,
    error: compareError,
    generatingIds,
    reload: reloadCompare,
    generateFitProfile,
  } = useSimulationCandidatesCompare({
    simulationId,
    enabled,
  });

  return (
    <CandidateCompareSection
      simulationId={simulationId}
      candidateCount={candidateCount}
      candidatesLoading={candidatesLoading}
      compareLoading={compareLoading}
      compareError={compareError}
      rows={compareRows}
      generatingIds={generatingIds}
      onRetry={reloadCompare}
      onGenerate={generateFitProfile}
    />
  );
}
