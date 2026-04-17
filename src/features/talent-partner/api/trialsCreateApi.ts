import { extractBackendMessage } from '@/platform/api-client/errors/errors';
import type { CreateTrialInput, CreateTrialResponse } from './typesApi';
import { normalizeCreateTrialResponse } from './trialsNormalizeApi';
import { isRecord } from './trialUtilsApi';
import { requestTalentPartnerBff } from './requestTalentPartnerBffApi';
import { extractProvidedTrialEvalEnabledByDay } from './trialAiEvalApi';
import { mapCreateTrialError } from './trialsCreate.errorsApi';

export async function createTrial(
  input: CreateTrialInput,
  options?: { signal?: AbortSignal; cache?: RequestCache },
): Promise<CreateTrialResponse> {
  const safeTitle = input.title.trim();
  const safeRole = input.role.trim();
  const safePreferredLanguageFramework =
    input.preferredLanguageFramework?.trim();
  const safeFocus = input.focus?.trim() ? input.focus.trim() : undefined;
  const safeCompanyDomain = input.companyContext?.domain?.trim();
  const safeProductArea = input.companyContext?.productArea?.trim();
  const safeNoticeVersion = input.ai?.noticeVersion?.trim();
  const promptOverrides =
    input.ai?.promptOverrides &&
    Object.keys(input.ai.promptOverrides).length > 0
      ? input.ai.promptOverrides
      : null;

  if (!safeTitle || !safeRole) {
    return {
      id: '',
      ok: false,
      status: 400,
      message: 'Missing required fields',
    };
  }

  const evalEnabledByDay = extractProvidedTrialEvalEnabledByDay(
    input.ai?.evalEnabledByDay,
  );

  const payload = {
    title: safeTitle,
    role: safeRole,
    seniority: input.seniority,
    ...(safePreferredLanguageFramework
      ? { preferredLanguageFramework: safePreferredLanguageFramework }
      : {}),
    ...(safeFocus ? { focus: safeFocus } : {}),
    ...(safeCompanyDomain || safeProductArea
      ? {
          companyContext: {
            ...(safeCompanyDomain ? { domain: safeCompanyDomain } : {}),
            ...(safeProductArea ? { productArea: safeProductArea } : {}),
          },
        }
      : {}),
    ...(safeNoticeVersion || evalEnabledByDay || promptOverrides
      ? {
          ai: {
            ...(safeNoticeVersion ? { noticeVersion: safeNoticeVersion } : {}),
            ...(evalEnabledByDay ? { evalEnabledByDay } : {}),
            ...(promptOverrides ? { promptOverrides } : {}),
          },
        }
      : {}),
  };

  try {
    const { data } = await requestTalentPartnerBff<unknown>('/trials', {
      method: 'POST',
      body: payload,
      cache: options?.cache,
      signal: options?.signal,
    });

    const statusFromData = isRecord(data)
      ? (data as { status?: unknown }).status
      : undefined;
    const normalized = normalizeCreateTrialResponse(
      data,
      typeof statusFromData === 'number' ? statusFromData : 201,
    );
    if (!normalized.ok) {
      const message =
        normalized.message ??
        extractBackendMessage(data, true) ??
        'Unable to create trial. Please try again shortly.';
      return { ...normalized, message };
    }
    return normalized;
  } catch (caught: unknown) {
    return mapCreateTrialError(caught);
  }
}
