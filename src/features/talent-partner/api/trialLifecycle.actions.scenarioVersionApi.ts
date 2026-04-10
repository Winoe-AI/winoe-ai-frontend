import { requestTalentPartnerBff } from './requestTalentPartnerBffApi';
import { safeId } from './trialUtilsApi';
import { mapActionError } from './trialLifecycle.errorsApi';
import {
  toScenarioApproveResponse,
  toScenarioPatchResponse,
} from './trialLifecycle.normalizersApi';
import type {
  ScenarioApproveResponse,
  ScenarioPatchPayload,
  ScenarioPatchResponse,
  TrialActionResult,
} from './trialLifecycle.typesApi';

export async function approveScenarioVersion(
  trialId: string | number,
  scenarioVersionId: string | number,
): Promise<TrialActionResult<ScenarioApproveResponse | null>> {
  try {
    const id = safeId(trialId);
    const versionId = safeId(scenarioVersionId);
    if (!id || !versionId) {
      return {
        ok: false,
        statusCode: 400,
        message: 'Trial and scenario version IDs are required.',
      };
    }

    const { data } = await requestTalentPartnerBff<unknown>(
      `/backend/trials/${encodeURIComponent(id)}/scenario/${encodeURIComponent(versionId)}/approve`,
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
    ) as TrialActionResult<ScenarioApproveResponse | null>;
  }
}

export async function patchScenarioVersion(
  trialId: string | number,
  scenarioVersionId: string | number,
  payload: ScenarioPatchPayload,
): Promise<TrialActionResult<ScenarioPatchResponse | null>> {
  try {
    const id = safeId(trialId);
    const versionId = safeId(scenarioVersionId);
    if (!id || !versionId) {
      return {
        ok: false,
        statusCode: 400,
        message: 'Trial and scenario version IDs are required.',
      };
    }

    const { data } = await requestTalentPartnerBff<unknown>(
      `/backend/trials/${encodeURIComponent(id)}/scenario/${encodeURIComponent(versionId)}`,
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
    ) as TrialActionResult<ScenarioPatchResponse | null>;
  }
}
