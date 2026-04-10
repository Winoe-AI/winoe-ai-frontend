import { safeId } from './trialUtilsApi';
import { toScenarioRegenerateResponse } from './trialLifecycle.normalizersApi';
import type {
  ScenarioRegenerateResponse,
  TrialActionResult,
} from './trialLifecycle.typesApi';
import { tryPostWithFallback } from './trialLifecycle.actions.postFallbackApi';

export async function regenerateTrialScenario(
  trialId: string | number,
): Promise<TrialActionResult<ScenarioRegenerateResponse | null>> {
  try {
    const id = safeId(trialId);
    if (!id) {
      return {
        ok: false,
        statusCode: 400,
        message: 'Trial ID is required.',
      };
    }

    const result = await tryPostWithFallback(
      [`/backend/trials/${encodeURIComponent(id)}/scenario/regenerate`],
      { confirm: true, reason: 'regenerate' },
      'Unable to regenerate scenario.',
    );

    if (!result.ok) {
      return result as TrialActionResult<ScenarioRegenerateResponse | null>;
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

export async function retryTrialGeneration(
  trialId: string | number,
): Promise<TrialActionResult> {
  try {
    const id = safeId(trialId);
    if (!id) {
      return {
        ok: false,
        statusCode: 400,
        message: 'Trial ID is required.',
      };
    }

    return tryPostWithFallback(
      [`/backend/trials/${encodeURIComponent(id)}/scenario/regenerate`],
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
