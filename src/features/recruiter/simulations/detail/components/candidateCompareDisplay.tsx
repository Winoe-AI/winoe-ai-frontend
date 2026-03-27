import type {
  CandidateCompareFitProfileStatus,
  CandidateCompareRow,
} from '@/features/recruiter/api/candidatesCompare';

export const FIT_PROFILE_META: Record<
  CandidateCompareFitProfileStatus,
  { label: string; tone: 'info' | 'success' | 'warning' | 'muted' }
> = {
  not_generated: { label: 'Not generated', tone: 'muted' },
  generating: { label: 'Generating', tone: 'info' },
  ready: { label: 'Ready', tone: 'success' },
  failed: { label: 'Failed', tone: 'warning' },
};

export function formatCandidateLabel(row: CandidateCompareRow): string {
  return row.candidateName ?? row.candidateEmail ?? row.candidateLabel;
}

export function StrengthRiskBadges({ row }: { row: CandidateCompareRow }) {
  const strengths = row.strengths.slice(0, 2);
  const risks = row.risks.slice(0, 2);
  if (!strengths.length && !risks.length) {
    return <span className="text-gray-400">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {strengths.map((strength) => (
        <span
          key={`strength-${row.candidateSessionId}-${strength}`}
          className="max-w-[180px] truncate rounded border border-green-200 bg-green-50 px-2 py-0.5 text-xs text-green-800"
          title={strength}
        >
          Strength: {strength}
        </span>
      ))}
      {risks.map((risk) => (
        <span
          key={`risk-${row.candidateSessionId}-${risk}`}
          className="max-w-[180px] truncate rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-900"
          title={risk}
        >
          Risk: {risk}
        </span>
      ))}
    </div>
  );
}
