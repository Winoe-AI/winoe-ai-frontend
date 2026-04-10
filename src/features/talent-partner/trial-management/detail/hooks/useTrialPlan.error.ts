import { useMemo } from 'react';
import { toStatus, toUserMessage } from '@/platform/errors/errors';

export function useTrialPlanError(detailError: unknown) {
  const statusCode = useMemo(() => {
    if (!detailError) return null;
    return toStatus(detailError);
  }, [detailError]);

  const error = useMemo(() => {
    if (!detailError) return null;
    if (statusCode === 404) return 'Trial not found.';
    if (statusCode === 403) return "You don't have access to this trial.";
    return toUserMessage(detailError, 'Failed to load trial details.', {
      includeDetail: false,
    });
  }, [detailError, statusCode]);

  return { statusCode, error };
}
