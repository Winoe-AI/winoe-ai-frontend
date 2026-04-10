import type {
  CandidateCompareWinoeReportStatus,
  CandidateCompareRow,
} from '@/features/talent-partner/api/candidatesCompareApi';

export type SortColumn =
  | 'candidate'
  | 'status'
  | 'winoe_report'
  | 'winoe_score';
export type SortDirection = 'asc' | 'desc';
export type SortState = { column: SortColumn; direction: SortDirection };

const WINOE_REPORT_ORDER: Record<CandidateCompareWinoeReportStatus, number> = {
  ready: 0,
  generating: 1,
  failed: 2,
  not_generated: 3,
};

function toTimestamp(value: string | null): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function compareDefault(
  a: CandidateCompareRow,
  b: CandidateCompareRow,
): number {
  const winoeReportDelta =
    WINOE_REPORT_ORDER[a.winoeReportStatus] -
    WINOE_REPORT_ORDER[b.winoeReportStatus];
  if (winoeReportDelta !== 0) return winoeReportDelta;
  const scoreA = a.overallWinoeScore ?? -1;
  const scoreB = b.overallWinoeScore ?? -1;
  if (scoreA !== scoreB) return scoreB - scoreA;
  const updatedDelta = toTimestamp(b.updatedAt) - toTimestamp(a.updatedAt);
  if (updatedDelta !== 0) return updatedDelta;
  return a.candidateLabel.localeCompare(b.candidateLabel);
}

export function compareByColumn(
  a: CandidateCompareRow,
  b: CandidateCompareRow,
  sort: SortState,
): number {
  let base = 0;
  if (sort.column === 'candidate')
    base = a.candidateLabel.localeCompare(b.candidateLabel);
  else if (sort.column === 'status')
    base = (a.status ?? '').localeCompare(b.status ?? '');
  else if (sort.column === 'winoe_report') {
    base =
      WINOE_REPORT_ORDER[a.winoeReportStatus] -
      WINOE_REPORT_ORDER[b.winoeReportStatus];
  } else if (sort.column === 'winoe_score') {
    base = (a.overallWinoeScore ?? -1) - (b.overallWinoeScore ?? -1);
  }
  if (base === 0) return compareDefault(a, b);
  return sort.direction === 'asc' ? base : -base;
}

export function nextSort(
  current: SortState | null,
  column: SortColumn,
): SortState {
  if (!current || current.column !== column) {
    return { column, direction: column === 'winoe_score' ? 'desc' : 'asc' };
  }
  return { column, direction: current.direction === 'asc' ? 'desc' : 'asc' };
}

export function sortIndicator(
  sort: SortState | null,
  column: SortColumn,
): string {
  if (!sort || sort.column !== column) return '↕';
  return sort.direction === 'asc' ? '↑' : '↓';
}

export function sortAriaValue(
  sort: SortState | null,
  column: SortColumn,
): 'none' | 'ascending' | 'descending' {
  if (!sort || sort.column !== column) return 'none';
  return sort.direction === 'asc' ? 'ascending' : 'descending';
}
