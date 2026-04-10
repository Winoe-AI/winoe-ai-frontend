import { toStatus, toUserMessage } from '@/platform/errors/errors';
import type {
  WinoeReportFetchOutcome,
  WinoeReportState,
} from './winoeReport.types';
import {
  accessDeniedState,
  errorState,
  generatingState,
  notGeneratedState,
} from './winoeReport.state';

export function stateFromOutcome(
  outcome: WinoeReportFetchOutcome,
): WinoeReportState {
  if (outcome.kind === 'ready') {
    return {
      status: 'ready',
      report: outcome.report,
      generatedAt: outcome.generatedAt,
      warnings: outcome.warnings,
      message: 'Winoe Report ready.',
      errorCode: null,
    };
  }
  if (outcome.kind === 'running') {
    return generatingState(
      'Winoe Report is generating. This page will refresh automatically.',
    );
  }
  if (outcome.kind === 'not_started') return notGeneratedState();
  return errorState(outcome.message, outcome.errorCode ?? null);
}

export function stateFromLoadError(error: unknown): WinoeReportState {
  const status = toStatus(error);
  if (status === 409) {
    return generatingState(
      'Winoe Report is generating. This page will refresh automatically.',
    );
  }
  if (status === 404) {
    return notGeneratedState(
      'Evaluation not found. Generate a Winoe Report to create one.',
    );
  }
  if (status === 403) return accessDeniedState();
  return errorState(
    toUserMessage(error, 'Unable to load Winoe Report right now.', {
      includeDetail: false,
    }),
  );
}

export function stateFromGenerateError(error: unknown): WinoeReportState {
  const status = toStatus(error);
  if (status === 409) {
    return generatingState(
      'Winoe Report generation is already in progress. Refreshing status...',
    );
  }
  if (status === 403) return accessDeniedState();
  if (status === 404) {
    return notGeneratedState(
      'Evaluation not found. Generate a Winoe Report to create one.',
    );
  }
  return errorState(
    toUserMessage(error, 'Unable to generate Winoe Report right now.', {
      includeDetail: false,
    }),
  );
}
