'use client';
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchCandidateWinoeReport } from '@/features/talent-partner/winoe-report/winoeReport.api';
import { getSubmissionReview } from '@/features/talent-partner/api/submissionReviewApi';
import { queryKeys } from '@/shared/query';

export function useCandidateRowPrefetch(
  trialId: string,
  candidateSessionId: number,
) {
  const queryClient = useQueryClient();

  return useCallback(() => {
    const sessionId = String(candidateSessionId);
    void Promise.all([
      queryClient.prefetchQuery({
        queryKey: [
          'talent_partner',
          'submission-review',
          trialId,
          sessionId,
        ] as const,
        queryFn: ({ signal }) =>
          getSubmissionReview(trialId, sessionId, {
            signal,
            cache: 'no-store',
            dedupeKey: `submission-review-${trialId}-${sessionId}`,
          }),
        staleTime: 10_000,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.talentPartner.winoeReportStatus(sessionId),
        queryFn: ({ signal }) => fetchCandidateWinoeReport(sessionId, signal),
        staleTime: 10_000,
      }),
    ]);
  }, [candidateSessionId, queryClient, trialId]);
}
