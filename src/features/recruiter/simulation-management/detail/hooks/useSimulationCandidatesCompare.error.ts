import { toStatus, toUserMessage } from '@/platform/errors/errors';

export function deriveSimulationCandidatesCompareError(
  queryError: unknown,
  localError: string | null,
): string | null {
  if (localError) return localError;
  if (!queryError) return null;

  const status = toStatus(queryError);
  if (status === 403) {
    return 'You are not authorized to compare candidates for this simulation.';
  }
  if (status === 404) {
    return 'Compare candidates unavailable for this simulation right now.';
  }
  return toUserMessage(
    queryError,
    'Unable to load candidate comparison right now.',
    {
      includeDetail: false,
    },
  );
}
