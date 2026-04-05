import { extractBackendMessage } from '@/platform/api-client/errors/errors';
import type {
  CreateSimulationInput,
  CreateSimulationResponse,
} from './typesApi';
import { normalizeCreateSimulationResponse } from './simulationsNormalizeApi';
import { isRecord } from './simUtilsApi';
import { requestRecruiterBff } from './requestRecruiterBffApi';
import { extractProvidedSimulationEvalEnabledByDay } from './simulationAiEvalApi';
import { mapCreateSimulationError } from './simulationsCreate.errorsApi';

export async function createSimulation(
  input: CreateSimulationInput,
  options?: { signal?: AbortSignal; cache?: RequestCache },
): Promise<CreateSimulationResponse> {
  const safeTitle = input.title.trim();
  const safeRole = input.role.trim();
  const safeTechStack = input.techStack.trim();
  const safeTemplateKey = input.templateKey.trim();
  const safeFocus = input.focus?.trim() ? input.focus.trim() : undefined;
  const safeCompanyDomain = input.companyContext?.domain?.trim();
  const safeProductArea = input.companyContext?.productArea?.trim();
  const safeNoticeVersion = input.ai?.noticeVersion?.trim();
  const promptOverrides =
    input.ai?.promptOverrides &&
    Object.keys(input.ai.promptOverrides).length > 0
      ? input.ai.promptOverrides
      : null;

  if (!safeTitle || !safeRole || !safeTechStack || !safeTemplateKey) {
    return {
      id: '',
      ok: false,
      status: 400,
      message: 'Missing required fields',
    };
  }

  const evalEnabledByDay = extractProvidedSimulationEvalEnabledByDay(
    input.ai?.evalEnabledByDay,
  );

  const payload = {
    title: safeTitle,
    role: safeRole,
    techStack: safeTechStack,
    seniority: input.seniority,
    templateKey: safeTemplateKey,
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
    const { data } = await requestRecruiterBff<unknown>('/simulations', {
      method: 'POST',
      body: payload,
      cache: options?.cache,
      signal: options?.signal,
    });

    const statusFromData = isRecord(data)
      ? (data as { status?: unknown }).status
      : undefined;
    const normalized = normalizeCreateSimulationResponse(
      data,
      typeof statusFromData === 'number' ? statusFromData : 201,
    );
    if (!normalized.ok) {
      const message =
        normalized.message ??
        extractBackendMessage(data, true) ??
        'Unable to create simulation. Please try again shortly.';
      return { ...normalized, message };
    }
    return normalized;
  } catch (caught: unknown) {
    return mapCreateSimulationError(caught);
  }
}
