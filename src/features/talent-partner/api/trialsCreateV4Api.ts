import { extractBackendMessage } from '@/platform/api-client/errors/errors';
import type { CreateTrialV4Input, CreateTrialV4Result } from './typesApi';
import { normalizeCreateTrialV4Response } from './trialsNormalizeApi';
import { isRecord } from './trialUtilsApi';
import { requestTalentPartnerBff } from './requestTalentPartnerBffApi';
import { mapCreateTrialError } from './trialsCreate.errorsApi';

export async function createTrialV4(
  input: CreateTrialV4Input,
  options?: { signal?: AbortSignal; cache?: RequestCache },
): Promise<CreateTrialV4Result> {
  const roleTitle = input.roleTitle.trim();
  const focusNotes = input.focusNotes.trim();
  const pref = input.preferredLanguageFramework?.trim();
  const areas = (input.evaluationFocusAreas ?? [])
    .map((a) => a.trim())
    .filter(Boolean);

  if (!roleTitle || !focusNotes) {
    return {
      ok: false,
      status: 400,
      trialId: '',
      jobId: '',
      message: 'Missing required fields',
    };
  }

  const body: Record<string, unknown> = {
    role_title: roleTitle,
    seniority: input.seniority,
    focus_notes: focusNotes,
  };
  if (pref) body.preferred_language_framework = pref;
  if (areas.length > 0) body.evaluation_focus_areas = areas;

  try {
    const { data } = await requestTalentPartnerBff<unknown>('/v1/trials', {
      method: 'POST',
      body,
      cache: options?.cache,
      signal: options?.signal,
    });

    const statusFromData = isRecord(data)
      ? (data as { status?: unknown }).status
      : undefined;
    const normalized = normalizeCreateTrialV4Response(
      data,
      typeof statusFromData === 'number' ? statusFromData : 202,
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
    const base = mapCreateTrialError(caught);
    return {
      ok: false,
      status: base.status,
      trialId: '',
      jobId: '',
      message: base.message,
      details: base.details,
    };
  }
}
