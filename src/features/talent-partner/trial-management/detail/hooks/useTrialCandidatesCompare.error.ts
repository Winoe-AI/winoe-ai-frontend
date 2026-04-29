import { toStatus, toUserMessage } from '@/platform/errors/errors';

export function deriveTrialCandidatesCompareError(
  queryError: unknown,
  localError: string | null,
): string | null {
  if (localError) return localError;
  if (!queryError) return null;

  const status = toStatus(queryError);
  if (status === 403) {
    return 'You are not authorized to view Benchmarks for this trial.';
  }
  if (status === 404) {
    return 'Benchmarks unavailable for this trial right now.';
  }
  return toUserMessage(queryError, 'Unable to load Benchmarks right now.', {
    includeDetail: false,
  });
}
