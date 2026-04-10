import { toStatus } from '@/platform/errors/errors';
import type { TerminateTrialResponse } from './typesApi';
import { requestTalentPartnerBff } from './requestTalentPartnerBffApi';
import { safeId } from './trialUtilsApi';
import {
  mapActionError,
  TERMINATE_UNSUPPORTED_STATUSES,
} from './trialLifecycle.errorsApi';
import {
  maybeIdempotentTerminateFromError,
  isTerminatedStatus,
  toTerminateResponse,
} from './trialLifecycle.normalizersApi';
import type { TrialActionResult } from './trialLifecycle.typesApi';

export async function terminateTrial(
  trialId: string | number,
): Promise<TrialActionResult & { data?: TerminateTrialResponse }> {
  try {
    const id = safeId(trialId);
    if (!id) {
      return {
        ok: false,
        statusCode: 400,
        message: 'Trial ID is required.',
      };
    }

    const { data } = await requestTalentPartnerBff<unknown>(
      `/trials/${encodeURIComponent(id)}/terminate`,
      { method: 'POST', body: { confirm: true } },
    );

    const normalized = toTerminateResponse(data, id);
    const terminated = isTerminatedStatus(normalized.status);
    return {
      ok: terminated,
      statusCode: 200,
      message: terminated ? null : 'Unable to terminate trial.',
      errorCode: null,
      details: null,
      data: normalized,
    };
  } catch (error) {
    const statusCode = toStatus(error);
    if (statusCode === 409) {
      const id = safeId(trialId);
      const idempotent = maybeIdempotentTerminateFromError(error, id);
      if (idempotent) {
        return {
          ok: true,
          statusCode: 200,
          message: null,
          errorCode: null,
          details: null,
          data: idempotent,
        };
      }
    }

    const mapped = mapActionError(error, 'Unable to terminate trial.', {
      unsupportedStatuses: TERMINATE_UNSUPPORTED_STATUSES,
    });
    return {
      ok: mapped.ok,
      statusCode: mapped.statusCode,
      message: mapped.message,
      unsupported: mapped.unsupported,
      errorCode: mapped.errorCode,
      details: mapped.details,
    };
  }
}
