import {
  asRecord,
  normalizeStatus,
} from './candidatesCompareNormalize.recordsApi';
import type { CandidateCompareWinoeReportStatus } from './candidatesCompareNormalize.typesApi';

const WINOE_REPORT_READY = new Set([
  'ready',
  'generated',
  'complete',
  'completed',
  'available',
]);

const WINOE_REPORT_GENERATING = new Set([
  'generating',
  'running',
  'queued',
  'pending',
  'in_progress',
  'in progress',
]);

const WINOE_REPORT_FAILED = new Set(['failed', 'error']);

const WINOE_REPORT_MISSING = new Set([
  'not_generated',
  'not generated',
  'not_started',
  'not started',
  'missing',
  'none',
  'absent',
]);

export function parseWinoeReportStatus(
  record: Record<string, unknown>,
  score: number | null,
  recommendation: string | null,
): CandidateCompareWinoeReportStatus {
  const winoeReportRecord = asRecord(record.winoeReport);
  const winoeReportSnakeRecord = asRecord(record.winoe_report);
  const normalized = normalizeStatus(
    record.winoeReportStatus ??
      record.winoe_report_status ??
      winoeReportRecord?.status ??
      winoeReportSnakeRecord?.status ??
      record.reportStatus ??
      record.report_status,
  );

  if (normalized && WINOE_REPORT_READY.has(normalized)) return 'ready';
  if (normalized && WINOE_REPORT_GENERATING.has(normalized))
    return 'generating';
  if (normalized && WINOE_REPORT_FAILED.has(normalized)) return 'failed';
  if (normalized && WINOE_REPORT_MISSING.has(normalized))
    return 'not_generated';

  if (score !== null || recommendation !== null) return 'ready';
  return 'not_generated';
}
