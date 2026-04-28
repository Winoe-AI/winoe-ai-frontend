import type { WinoeReportFetchOutcome } from './winoeReport.types';
import {
  asRecord,
  normalizeStatus,
  toNullableString,
} from './winoeReport.normalize.base';
import { normalizeReport } from './winoeReport.normalizeReport';
import { normalizeWarnings } from './winoeReport.normalizeWarnings';

export function normalizeWinoeReportPayload(
  payload: unknown,
): WinoeReportFetchOutcome {
  const record = asRecord(payload);
  if (!record) {
    return {
      kind: 'failed',
      errorCode: 'winoe_report_payload_invalid',
      message: 'Winoe Report payload was invalid.',
    };
  }

  const topLevelWarnings = normalizeWarnings(record, null);
  const status = normalizeStatus(record.status);
  if (status === 'running')
    return { kind: 'running', warnings: topLevelWarnings };
  if (status === 'not_started') return { kind: 'not_started' };
  if (status === 'failed') {
    return {
      kind: 'failed',
      errorCode: toNullableString(record.errorCode ?? record.error_code),
      message: 'Winoe Report generation failed. Please retry.',
    };
  }

  const reportCandidate =
    asRecord(record.report) ??
    asRecord(record.reportData) ??
    (record.overallWinoeScore !== undefined ? record : null) ??
    (record.overall_winoe_score !== undefined ? record : null) ??
    (record.dimensionScores !== undefined ? record : null) ??
    (record.dimension_scores !== undefined ? record : null);
  if (status === 'ready' || reportCandidate) {
    const report = normalizeReport(reportCandidate);
    if (!report) {
      return {
        kind: 'failed',
        errorCode: 'winoe_report_report_invalid',
        message: 'Winoe Report report was missing or invalid.',
      };
    }
    const warnings = Array.from(
      new Set([...topLevelWarnings, ...report.warnings]),
    );
    return {
      kind: 'ready',
      report: { ...report, warnings },
      generatedAt: toNullableString(record.generatedAt ?? record.generated_at),
      warnings,
    };
  }

  return { kind: 'not_started' };
}
