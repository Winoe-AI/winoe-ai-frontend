'use client';

import Link from 'next/link';
import Button from '@/shared/ui/Button';
import { StatusPill } from '@/shared/ui/StatusPill';
import { statusMeta } from '@/shared/status/statusMeta';
import {
  formatRecommendationLabel,
  formatScorePercent,
} from '@/features/talent-partner/winoe-report/winoeReportFormatting';
import type { CandidateCompareRow } from '@/features/talent-partner/api/candidatesCompareApi';
import {
  WINOE_REPORT_META,
  formatCandidateLabel,
  StrengthRiskBadges,
} from './CandidateCompareDisplay';

const LINK_PREFETCH = process.env.NODE_ENV === 'test' ? undefined : false;

type Props = {
  trialId: string;
  row: CandidateCompareRow;
  generatingIds: Record<string, boolean>;
  onGenerate: (candidateSessionId: string) => void;
};

export function CandidateCompareTableRow({
  trialId,
  row,
  generatingIds,
  onGenerate,
}: Props) {
  const status = statusMeta(row.status, 'Unknown');
  const winoeReport = WINOE_REPORT_META[row.winoeReportStatus];
  const isGenerating =
    generatingIds[row.candidateSessionId] ||
    row.winoeReportStatus === 'generating';
  const submissionsHref = `/dashboard/trials/${trialId}/candidates/${row.candidateSessionId}`;
  const winoeReportHref = `${submissionsHref}/winoe-report`;

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
        <StatusPill label={winoeReport.label} tone={winoeReport.tone} />
      </td>
      <td className="px-4 py-3 align-top font-semibold text-gray-900">
        {row.overallWinoeScore === null
          ? '—'
          : formatScorePercent(row.overallWinoeScore)}
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
            href={winoeReportHref}
            prefetch={LINK_PREFETCH}
          >
            View Winoe Report
          </Link>
          {row.winoeReportStatus !== 'ready' ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onGenerate(row.candidateSessionId)}
              disabled={isGenerating}
            >
              {isGenerating
                ? 'Generating Winoe Report'
                : 'Generate Winoe Report'}
            </Button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
