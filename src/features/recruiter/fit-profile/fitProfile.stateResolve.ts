import { toStatus, toUserMessage } from '@/platform/errors/errors';
import type {
  FitProfileFetchOutcome,
  FitProfileState,
} from './fitProfile.types';
import {
  accessDeniedState,
  errorState,
  generatingState,
  notGeneratedState,
} from './fitProfile.state';

export function stateFromOutcome(
  outcome: FitProfileFetchOutcome,
): FitProfileState {
  if (outcome.kind === 'ready') {
    return {
      status: 'ready',
      report: outcome.report,
      generatedAt: outcome.generatedAt,
      warnings: outcome.warnings,
      message: 'Fit Profile ready.',
      errorCode: null,
    };
  }
  if (outcome.kind === 'running') {
    return generatingState(
      'Fit Profile is generating. This page will refresh automatically.',
    );
  }
  if (outcome.kind === 'not_started') return notGeneratedState();
  return errorState(outcome.message, outcome.errorCode ?? null);
}

export function stateFromLoadError(error: unknown): FitProfileState {
  const status = toStatus(error);
  if (status === 409) {
    return generatingState(
      'Fit Profile is generating. This page will refresh automatically.',
    );
  }
  if (status === 404) {
    return notGeneratedState(
      'Evaluation not found. Generate a Fit Profile to create one.',
    );
  }
  if (status === 403) return accessDeniedState();
  return errorState(
    toUserMessage(error, 'Unable to load Fit Profile right now.', {
      includeDetail: false,
    }),
  );
}

export function stateFromGenerateError(error: unknown): FitProfileState {
  const status = toStatus(error);
  if (status === 409) {
    return generatingState(
      'Fit Profile generation is already in progress. Refreshing status...',
    );
  }
  if (status === 403) return accessDeniedState();
  if (status === 404) {
    return notGeneratedState(
      'Evaluation not found. Generate a Fit Profile to create one.',
    );
  }
  return errorState(
    toUserMessage(error, 'Unable to generate Fit Profile right now.', {
      includeDetail: false,
    }),
  );
}
