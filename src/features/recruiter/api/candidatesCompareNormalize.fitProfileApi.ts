import {
  asRecord,
  normalizeStatus,
} from './candidatesCompareNormalize.recordsApi';
import type { CandidateCompareFitProfileStatus } from './candidatesCompareNormalize.typesApi';

const FIT_PROFILE_READY = new Set([
  'ready',
  'generated',
  'complete',
  'completed',
  'available',
]);

const FIT_PROFILE_GENERATING = new Set([
  'generating',
  'running',
  'queued',
  'pending',
  'in_progress',
  'in progress',
]);

const FIT_PROFILE_FAILED = new Set(['failed', 'error']);

const FIT_PROFILE_MISSING = new Set([
  'not_generated',
  'not generated',
  'not_started',
  'not started',
  'missing',
  'none',
  'absent',
]);

export function parseFitProfileStatus(
  record: Record<string, unknown>,
  score: number | null,
  recommendation: string | null,
): CandidateCompareFitProfileStatus {
  const fitProfileRecord = asRecord(record.fitProfile);
  const fitProfileSnakeRecord = asRecord(record.fit_profile);
  const normalized = normalizeStatus(
    record.fitProfileStatus ??
      record.fit_profile_status ??
      fitProfileRecord?.status ??
      fitProfileSnakeRecord?.status ??
      record.reportStatus ??
      record.report_status,
  );

  if (normalized && FIT_PROFILE_READY.has(normalized)) return 'ready';
  if (normalized && FIT_PROFILE_GENERATING.has(normalized)) return 'generating';
  if (normalized && FIT_PROFILE_FAILED.has(normalized)) return 'failed';
  if (normalized && FIT_PROFILE_MISSING.has(normalized)) return 'not_generated';

  if (score !== null || recommendation !== null) return 'ready';
  return 'not_generated';
}
