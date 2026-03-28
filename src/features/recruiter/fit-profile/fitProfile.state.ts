import type { FitProfileState } from './fitProfile.types';

function baseState(
  status: FitProfileState['status'],
  message: string,
): FitProfileState {
  return {
    status,
    report: null,
    generatedAt: null,
    warnings: [],
    message,
    errorCode: null,
  };
}

export const INITIAL_FIT_PROFILE_STATE: FitProfileState = baseState(
  'not_generated',
  'Loading Fit Profile...',
);

export function generatingState(
  message = 'Generating Fit Profile...',
): FitProfileState {
  return baseState('generating', message);
}

export function accessDeniedState(): FitProfileState {
  return baseState(
    'access_denied',
    'Access denied. You do not have permission to view this Fit Profile.',
  );
}

export function notGeneratedState(
  message = 'Fit Profile has not been generated yet. Generate a report to continue.',
): FitProfileState {
  return baseState('not_generated', message);
}

export function errorState(
  message: string,
  errorCode: string | null = null,
): FitProfileState {
  return { ...baseState('error', message), errorCode };
}
