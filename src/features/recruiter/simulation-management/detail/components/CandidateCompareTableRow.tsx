'use client';

import Link from 'next/link';
import Button from '@/shared/ui/Button';
import { StatusPill } from '@/shared/ui/StatusPill';
import { statusMeta } from '@/shared/status/statusMeta';
import {
  formatRecommendationLabel,
  formatScorePercent,
} from '@/features/recruiter/fit-profile/fitProfileFormatting';
import type { CandidateCompareRow } from '@/features/recruiter/api/candidatesCompareApi';
import {
  FIT_PROFILE_META,
  formatCandidateLabel,
  StrengthRiskBadges,
} from './CandidateCompareDisplay';

const LINK_PREFETCH = process.env.NODE_ENV === 'test' ? undefined : false;

type Props = {
  simulationId: string;
  row: CandidateCompareRow;
  generatingIds: Record<string, boolean>;
  onGenerate: (candidateSessionId: string) => void;
};

export function CandidateCompareTableRow({
  simulationId,
  row,
  generatingIds,
  onGenerate,
}: Props) {
  const status = statusMeta(row.status, 'Unknown');
  const fitProfile = FIT_PROFILE_META[row.fitProfileStatus];
  const isGenerating =
    generatingIds[row.candidateSessionId] ||
    row.fitProfileStatus === 'generating';
  const submissionsHref = `/dashboard/simulations/${simulationId}/candidates/${row.candidateSessionId}`;
  const fitProfileHref = `${submissionsHref}/fit-profile`;

  return (
    <tr
      key={row.candidateSessionId}
      data-testid={`candidate-compare-row-${row.candidateSessionId}`}
    >
      <td className="px-4 py-3 align-top">
        <div className="font-medium text-gray-900">
          {formatCandidateLabel(row)}
        </div>
        {row.candidateEmail ? (
          <div className="text-xs text-gray-500">{row.candidateEmail}</div>
        ) : null}
      </td>
      <td className="px-4 py-3 align-top">
        <StatusPill label={status.label} tone={status.tone} />
      </td>
      <td className="px-4 py-3 align-top">
        <StatusPill label={fitProfile.label} tone={fitProfile.tone} />
      </td>
      <td className="px-4 py-3 align-top font-semibold text-gray-900">
        {row.overallFitScore === null
          ? '—'
          : formatScorePercent(row.overallFitScore)}
      </td>
      <td className="px-4 py-3 align-top text-gray-700">
        {row.recommendation
          ? formatRecommendationLabel(row.recommendation)
          : '—'}
      </td>
      <td className="px-4 py-3 align-top">
        <StrengthRiskBadges row={row} />
      </td>
      <td className="px-4 py-3 align-top">
        <div className="flex flex-col items-start gap-2">
          <Link
            className="text-blue-600 hover:underline"
            href={submissionsHref}
            prefetch={LINK_PREFETCH}
          >
            View Submissions
          </Link>
          <Link
            className="text-blue-600 hover:underline"
            href={fitProfileHref}
            prefetch={LINK_PREFETCH}
          >
            View Fit Profile
          </Link>
          {row.fitProfileStatus !== 'ready' ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onGenerate(row.candidateSessionId)}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating Fit Profile' : 'Generate Fit Profile'}
            </Button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
