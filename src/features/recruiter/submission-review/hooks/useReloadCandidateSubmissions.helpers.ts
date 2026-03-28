import type { SubmissionArtifact } from '../types';
import type { ReloadResult } from './useReloadCandidateSubmissions.types';

export const isAbortError = (err: unknown) =>
  (err instanceof DOMException && err.name === 'AbortError') ||
  (err &&
    typeof err === 'object' &&
    (err as { name?: unknown }).name === 'AbortError');

export function invalidCandidateIdResult(): ReloadResult {
  return reloadErrorResult('Invalid candidate id.');
}

export function reloadErrorResult(message: string): ReloadResult {
  return {
    candidate: null,
    items: [],
    artifacts: {},
    artifactWarning: null,
    error: message,
  };
}

export function buildArtifactWarning(
  hadError: boolean,
  artifacts: Record<number, SubmissionArtifact>,
) {
  if (!hadError) return null;
  return Object.keys(artifacts).length === 0
    ? 'Details unavailable for submissions.'
    : 'Some submission details are unavailable.';
}
