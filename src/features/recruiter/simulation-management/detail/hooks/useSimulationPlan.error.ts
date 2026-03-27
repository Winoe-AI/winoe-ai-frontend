import { useMemo } from 'react';
import { toStatus, toUserMessage } from '@/platform/errors/errors';

export function useSimulationPlanError(detailError: unknown) {
  const statusCode = useMemo(() => {
    if (!detailError) return null;
    return toStatus(detailError);
  }, [detailError]);

  const error = useMemo(() => {
    if (!detailError) return null;
    if (statusCode === 404) return 'Simulation not found.';
    if (statusCode === 403) return "You don't have access to this simulation.";
    return toUserMessage(detailError, 'Failed to load simulation details.', {
      includeDetail: false,
    });
  }, [detailError, statusCode]);

  return { statusCode, error };
}
