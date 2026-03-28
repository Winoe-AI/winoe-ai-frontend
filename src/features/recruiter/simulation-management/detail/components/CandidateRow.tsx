'use client';
import Link from 'next/link';
import type { CandidateSession } from '@/features/recruiter/types';
import type { RowState } from '../hooks/useTypes';
import { CandidateDateCell } from './CandidateDateCell';
import { CandidateDayProgressCell } from './CandidateDayProgressCell';
import { CandidateIdentityCell } from './CandidateIdentityCell';
import { CandidateInviteCell } from './CandidateInviteCell';
import { CandidateReportCell } from './CandidateReportCell';
import { CandidateStatusCell } from './CandidateStatusCell';
import { CandidateVerificationCell } from './CandidateVerificationCell';
import { useCandidateRowPrefetch } from './useCandidateRowPrefetch';

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
  const submissionsHref = `/dashboard/simulations/${simulationId}/candidates/${candidate.candidateSessionId}`;
  const prefetchCandidateData = useCandidateRowPrefetch(
    simulationId,
    candidate.candidateSessionId,
  );

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
