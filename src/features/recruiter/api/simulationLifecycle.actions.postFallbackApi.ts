import { toStatus } from '@/platform/errors/errors';
import { requestRecruiterBff } from './requestRecruiterBffApi';
import {
  mapActionError,
  UNSUPPORTED_STATUSES,
} from './simulationLifecycle.errorsApi';
import type { SimulationActionResult } from './simulationLifecycle.typesApi';

export async function tryPostWithFallback(
  paths: string[],
  body: Record<string, unknown>,
  fallbackError: string,
): Promise<SimulationActionResult> {
  try {
    let lastError: unknown = null;

    for (const path of paths) {
      try {
        const { data } = await requestRecruiterBff<unknown>(path, {
          method: 'POST',
          body,
        });
        return {
          ok: true,
          statusCode: 200,
          message: null,
          errorCode: null,
          details: null,
          data,
        };
      } catch (error) {
        lastError = error;
        const statusCode = toStatus(error);
        if (statusCode !== null && UNSUPPORTED_STATUSES.has(statusCode))
          continue;
        return mapActionError(error, fallbackError);
      }
    }

    return mapActionError(lastError, fallbackError);
  } catch {
    return {
      ok: false,
      statusCode: null,
      errorCode: null,
      details: null,
      message: fallbackError,
    };
  }
}
