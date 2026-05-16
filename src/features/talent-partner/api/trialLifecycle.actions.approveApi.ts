import { requestTalentPartnerBff } from './requestTalentPartnerBffApi';
import { safeId } from './trialUtilsApi';
import { mapActionError } from './trialLifecycle.errorsApi';
import type { TrialActionResult } from './trialLifecycle.typesApi';

export async function approveTrialForInviting(
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

    const { data } = await requestTalentPartnerBff<unknown>(
      `/trials/${encodeURIComponent(id)}/approve`,
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
    return mapActionError(error, 'Unable to approve Trial.');
  }
}
