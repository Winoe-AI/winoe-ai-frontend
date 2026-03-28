import { safeId } from './simUtilsApi';
import { toScenarioRegenerateResponse } from './simulationLifecycle.normalizersApi';
import type {
  ScenarioRegenerateResponse,
  SimulationActionResult,
} from './simulationLifecycle.typesApi';
import { tryPostWithFallback } from './simulationLifecycle.actions.postFallbackApi';

export async function regenerateSimulationScenario(
  simulationId: string | number,
): Promise<SimulationActionResult<ScenarioRegenerateResponse | null>> {
  try {
    const id = safeId(simulationId);
    if (!id) {
      return {
        ok: false,
        statusCode: 400,
        message: 'Simulation ID is required.',
      };
    }

    const result = await tryPostWithFallback(
      [`/backend/simulations/${encodeURIComponent(id)}/scenario/regenerate`],
      { confirm: true, reason: 'regenerate' },
      'Unable to regenerate scenario.',
    );

    if (!result.ok) {
      return result as SimulationActionResult<ScenarioRegenerateResponse | null>;
    }

    return {
      ...result,
      data: toScenarioRegenerateResponse(result.data),
    };
  } catch {
    return {
      ok: false,
      statusCode: null,
      errorCode: null,
      details: null,
      message: 'Unable to regenerate scenario.',
    };
  }
}

export async function retrySimulationGeneration(
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

    return tryPostWithFallback(
      [`/backend/simulations/${encodeURIComponent(id)}/scenario/regenerate`],
      { confirm: true, reason: 'retry_generate' },
      'Unable to retry generation.',
    );
  } catch {
    return {
      ok: false,
      statusCode: null,
      errorCode: null,
      details: null,
      message: 'Unable to retry generation.',
    };
  }
}
