import { toStatus } from '@/platform/errors/errors';
import type { TerminateSimulationResponse } from './typesApi';
import { requestRecruiterBff } from './requestRecruiterBffApi';
import { safeId } from './simUtilsApi';
import {
  mapActionError,
  TERMINATE_UNSUPPORTED_STATUSES,
} from './simulationLifecycle.errorsApi';
import {
  maybeIdempotentTerminateFromError,
  isTerminatedStatus,
  toTerminateResponse,
} from './simulationLifecycle.normalizersApi';
import type { SimulationActionResult } from './simulationLifecycle.typesApi';

export async function terminateSimulation(
  simulationId: string | number,
): Promise<SimulationActionResult & { data?: TerminateSimulationResponse }> {
  try {
    const id = safeId(simulationId);
    if (!id) {
      return {
        ok: false,
        statusCode: 400,
        message: 'Simulation ID is required.',
      };
    }

    const { data } = await requestRecruiterBff<unknown>(
      `/simulations/${encodeURIComponent(id)}/terminate`,
      { method: 'POST', body: { confirm: true } },
    );

    const normalized = toTerminateResponse(data, id);
    const terminated = isTerminatedStatus(normalized.status);
    return {
      ok: terminated,
      statusCode: 200,
      message: terminated ? null : 'Unable to terminate simulation.',
      errorCode: null,
      details: null,
      data: normalized,
    };
  } catch (error) {
    const statusCode = toStatus(error);
    if (statusCode === 409) {
      const id = safeId(simulationId);
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

    const mapped = mapActionError(error, 'Unable to terminate simulation.', {
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
