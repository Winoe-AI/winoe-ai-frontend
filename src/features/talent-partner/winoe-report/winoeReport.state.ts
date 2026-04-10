import type { WinoeReportState } from './winoeReport.types';

function baseState(
  status: WinoeReportState['status'],
  message: string,
): WinoeReportState {
  return {
    status,
    report: null,
    generatedAt: null,
    warnings: [],
    message,
    errorCode: null,
  };
}

export const INITIAL_WINOE_REPORT_STATE: WinoeReportState = baseState(
  'not_generated',
  'Loading Winoe Report...',
);

export function generatingState(
  message = 'Generating Winoe Report...',
): WinoeReportState {
  return baseState('generating', message);
}

export function accessDeniedState(): WinoeReportState {
  return baseState(
    'access_denied',
    'Access denied. You do not have permission to view this Winoe Report.',
  );
}

export function notGeneratedState(
  message = 'Winoe Report has not been generated yet. Generate a report to continue.',
): WinoeReportState {
  return baseState('not_generated', message);
}

export function errorState(
  message: string,
  errorCode: string | null = null,
): WinoeReportState {
  return { ...baseState('error', message), errorCode };
}
