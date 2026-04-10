'use client';

import { CandidateCompareSection } from '../CandidateCompareSection';
import { useTrialCandidatesCompare } from '../../hooks/useTrialCandidatesCompare';

export type CandidateCompareSlotProps = {
  trialId: string;
  candidateCount: number;
  candidatesLoading: boolean;
  enabled: boolean;
};

export function CandidateCompareSlot({
  trialId,
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
    generateWinoeReport,
  } = useTrialCandidatesCompare({
    trialId,
    enabled,
  });

  return (
    <CandidateCompareSection
      trialId={trialId}
      candidateCount={candidateCount}
      candidatesLoading={candidatesLoading}
      compareLoading={compareLoading}
      compareError={compareError}
      rows={compareRows}
      generatingIds={generatingIds}
      onRetry={reloadCompare}
      onGenerate={generateWinoeReport}
    />
  );
}
