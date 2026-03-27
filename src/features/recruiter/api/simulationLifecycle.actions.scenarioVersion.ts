import { requestRecruiterBff } from './requestRecruiterBff';
import { safeId } from './simUtils';
import { mapActionError } from './simulationLifecycle.errors';
import {
  toScenarioApproveResponse,
  toScenarioPatchResponse,
} from './simulationLifecycle.normalizers';
import type {
  ScenarioApproveResponse,
  ScenarioPatchPayload,
  ScenarioPatchResponse,
  SimulationActionResult,
} from './simulationLifecycle.types';

export async function approveScenarioVersion(
  simulationId: string | number,
  scenarioVersionId: string | number,
): Promise<SimulationActionResult<ScenarioApproveResponse | null>> {
  try {
    const id = safeId(simulationId);
    const versionId = safeId(scenarioVersionId);
    if (!id || !versionId) {
      return {
        ok: false,
        statusCode: 400,
        message: 'Simulation and scenario version IDs are required.',
      };
    }

    const { data } = await requestRecruiterBff<unknown>(
      `/backend/simulations/${encodeURIComponent(id)}/scenario/${encodeURIComponent(versionId)}/approve`,
      { method: 'POST' },
    );

    return {
      ok: true,
      statusCode: 200,
      message: null,
      errorCode: null,
      details: null,
      data: toScenarioApproveResponse(data),
    };
  } catch (error) {
    return mapActionError(
      error,
      'Unable to approve this scenario version.',
    ) as SimulationActionResult<ScenarioApproveResponse | null>;
  }
}

export async function patchScenarioVersion(
  simulationId: string | number,
  scenarioVersionId: string | number,
  payload: ScenarioPatchPayload,
): Promise<SimulationActionResult<ScenarioPatchResponse | null>> {
  try {
    const id = safeId(simulationId);
    const versionId = safeId(scenarioVersionId);
    if (!id || !versionId) {
      return {
        ok: false,
        statusCode: 400,
        message: 'Simulation and scenario version IDs are required.',
      };
    }

    const { data } = await requestRecruiterBff<unknown>(
      `/backend/simulations/${encodeURIComponent(id)}/scenario/${encodeURIComponent(versionId)}`,
      { method: 'PATCH', body: payload },
    );

    return {
      ok: true,
      statusCode: 200,
      message: null,
      errorCode: null,
      details: null,
      data: toScenarioPatchResponse(data),
    };
  } catch (error) {
    return mapActionError(
      error,
      'Unable to save scenario edits.',
    ) as SimulationActionResult<ScenarioPatchResponse | null>;
  }
}
