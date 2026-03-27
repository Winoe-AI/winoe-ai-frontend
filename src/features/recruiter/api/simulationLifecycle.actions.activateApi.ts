import { requestRecruiterBff } from './requestRecruiterBffApi';
import { safeId } from './simUtilsApi';
import { mapActionError } from './simulationLifecycle.errorsApi';
import type { SimulationActionResult } from './simulationLifecycle.typesApi';

export async function activateSimulationInviting(
  simulationId: string | number,
): Promise<SimulationActionResult> {
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
      `/backend/simulations/${encodeURIComponent(id)}/activate`,
      { method: 'POST', body: { confirm: true } },
    );
    return {
      ok: true,
      statusCode: 200,
      message: null,
      errorCode: null,
      details: null,
      data,
    };
  } catch (error) {
    return mapActionError(error, 'Unable to approve simulation.');
  }
}
