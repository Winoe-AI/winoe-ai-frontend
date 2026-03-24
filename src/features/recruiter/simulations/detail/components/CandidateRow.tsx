'use client';
import Link from 'next/link';
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query';
import type { CandidateSession } from '@/features/recruiter/types';
import { fetchCandidateFitProfile } from '@/features/recruiter/simulations/candidates/fitProfile/fitProfile.api';
import { reloadCandidateSubmissions } from '@/features/recruiter/simulations/candidates/hooks/reloadCandidateSubmissions';
import type { RowState } from '../hooks/types';
import { CandidateDateCell } from './CandidateDateCell';
import { CandidateDayProgressCell } from './CandidateDayProgressCell';
import { CandidateIdentityCell } from './CandidateIdentityCell';
import { CandidateInviteCell } from './CandidateInviteCell';
import { CandidateReportCell } from './CandidateReportCell';
import { CandidateStatusCell } from './CandidateStatusCell';
import { CandidateVerificationCell } from './CandidateVerificationCell';

type Props = {
  candidate: CandidateSession;
  simulationId: string;
  rowState: RowState;
  cooldownNow: number;
  inviteResendEnabled: boolean;
  inviteResendDisabledReason: string | null;
  onCopy: (candidate: CandidateSession) => void;
  onResend: (candidate: CandidateSession) => void;
  onCloseManual: (id: number) => void;
};

const LINK_PREFETCH = process.env.NODE_ENV === 'test' ? undefined : false;

export function CandidateRow({
  candidate,
  simulationId,
  rowState,
  cooldownNow,
  inviteResendEnabled,
  inviteResendDisabledReason,
  onCopy,
  onResend,
  onCloseManual,
}: Props) {
  const queryClient = useQueryClient();
  const submissionsHref = `/dashboard/simulations/${simulationId}/candidates/${candidate.candidateSessionId}`;

  const prefetchCandidateData = useCallback(() => {
    const candidateSessionId = String(candidate.candidateSessionId);
    void Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.recruiter.candidateSubmissions(
          simulationId,
          candidateSessionId,
        ),
        queryFn: ({ signal }) =>
          reloadCandidateSubmissions({
            simulationId,
            candidateSessionId,
            pageSize: 8,
            showAll: false,
            preloadArtifacts: false,
            skipCache: false,
            signal,
          }),
        staleTime: 10_000,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.recruiter.fitProfileStatus(candidateSessionId),
        queryFn: ({ signal }) =>
          fetchCandidateFitProfile(candidateSessionId, signal),
        staleTime: 10_000,
      }),
    ]);
  }, [candidate.candidateSessionId, queryClient, simulationId]);

  return (
    <tr data-testid={`candidate-row-${candidate.candidateSessionId}`}>
      <CandidateIdentityCell candidate={candidate} />
      <CandidateStatusCell candidate={candidate} />
      <CandidateReportCell candidate={candidate} />
      <CandidateInviteCell
        candidate={candidate}
        rowState={rowState}
        cooldownNow={cooldownNow}
        inviteResendEnabled={inviteResendEnabled}
        inviteResendDisabledReason={inviteResendDisabledReason}
        onCopy={onCopy}
        onResend={onResend}
        onCloseManual={onCloseManual}
      />
      <CandidateVerificationCell candidate={candidate} />
      <CandidateDayProgressCell candidate={candidate} />
      <CandidateDateCell value={candidate.startedAt} />
      <CandidateDateCell value={candidate.completedAt} />
      <td className="px-4 py-3 text-right align-top">
        <Link
          className="text-blue-600 hover:underline"
          href={submissionsHref}
          prefetch={LINK_PREFETCH}
          onMouseEnter={prefetchCandidateData}
          onFocus={prefetchCandidateData}
        >
          View submissions →
        </Link>
      </td>
    </tr>
  );
}
