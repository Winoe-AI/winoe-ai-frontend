'use client';

import Link from 'next/link';
import {
  formatRecommendationEvidenceLanguage,
  formatScorePercent,
} from '@/features/talent-partner/winoe-report/winoeReportFormatting';
import type { CandidateCompareRow } from '@/features/talent-partner/api/candidatesCompareApi';
import {
  formatCandidateLabel,
  StrengthRiskBadges,
} from './CandidateCompareDisplay';

const LINK_PREFETCH = process.env.NODE_ENV === 'test' ? undefined : false;

type Props = {
  trialId: string;
  row: CandidateCompareRow;
};

export function CandidateCompareTableRow({ trialId, row }: Props) {
  const winoeReportHref = `/dashboard/trials/${trialId}/candidates/${row.candidateSessionId}/winoe-report`;

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
        <span className="font-semibold text-gray-900">
          {row.overallWinoeScore === null
            ? '—'
            : formatScorePercent(row.overallWinoeScore)}
        </span>
      </td>
      <td className="px-4 py-3 align-top">
        <StrengthRiskBadges row={row} />
      </td>
      <td className="px-4 py-3 align-top text-gray-700">
        {row.recommendation
          ? formatRecommendationEvidenceLanguage(row.recommendation)
          : '—'}
      </td>
      <td className="px-4 py-3 align-top">
        <div className="flex flex-col items-start gap-2">
          <Link
            className="text-blue-600 hover:underline"
            href={winoeReportHref}
            prefetch={LINK_PREFETCH}
          >
            View Winoe Report
          </Link>
        </div>
      </td>
    </tr>
  );
}
