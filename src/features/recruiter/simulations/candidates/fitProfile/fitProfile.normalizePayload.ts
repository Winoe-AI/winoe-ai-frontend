import type { FitProfileFetchOutcome } from './fitProfile.types';
import {
  asRecord,
  normalizeStatus,
  toNullableString,
} from './fitProfile.normalize.base';
import { normalizeReport } from './fitProfile.normalizeReport';
import { normalizeWarnings } from './fitProfile.normalizeWarnings';

export function normalizeFitProfilePayload(payload: unknown): FitProfileFetchOutcome {
  const record = asRecord(payload);
  if (!record) {
    return {
      kind: 'failed',
      errorCode: 'fit_profile_payload_invalid',
      message: 'Fit Profile payload was invalid.',
    };
  }

  const topLevelWarnings = normalizeWarnings(record, null);
  const status = normalizeStatus(record.status);
  if (status === 'running') return { kind: 'running', warnings: topLevelWarnings };
  if (status === 'not_started') return { kind: 'not_started' };
  if (status === 'failed') {
    return {
      kind: 'failed',
      errorCode: toNullableString(record.errorCode ?? record.error_code),
      message: 'Fit Profile generation failed. Please retry.',
    };
  }

  const reportCandidate =
    asRecord(record.report) ??
    (record.overallFitScore !== undefined ? record : null) ??
    (record.overall_fit_score !== undefined ? record : null);
  if (status === 'ready' || reportCandidate) {
    const report = normalizeReport(reportCandidate);
    if (!report) {
      return {
        kind: 'failed',
        errorCode: 'fit_profile_report_invalid',
        message: 'Fit Profile report was missing or invalid.',
      };
    }
    const warnings = Array.from(new Set([...topLevelWarnings, ...report.warnings]));
    return {
      kind: 'ready',
      report: { ...report, warnings },
      generatedAt: toNullableString(record.generatedAt ?? record.generated_at),
      warnings,
    };
  }

  return { kind: 'not_started' };
}
