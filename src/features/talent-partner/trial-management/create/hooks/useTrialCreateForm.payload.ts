import type { CreateTrialInput } from '@/features/talent-partner/api/typesApi';
import { buildPromptOverridePayload } from '@/features/talent-partner/ai/promptOverrideFormUtils';
import {
  AI_DAY_FIELD_MAP,
  AI_DAY_KEYS,
  type FormValues,
} from '../utils/createFormConfigUtils';

export function buildTrialCreatePayload(values: FormValues): CreateTrialInput {
  const roleTitle = values.title.trim();
  const roleDescription = values.role.trim();
  const trimmedDomain = values.companyDomain.trim();
  const trimmedProductArea = values.companyProductArea.trim();
  const trimmedFocus = values.focus.trim();
  const promptOverrides = buildPromptOverridePayload(values.promptOverrides);
  const evalEnabledByDay = AI_DAY_KEYS.reduce<
    NonNullable<CreateTrialInput['ai']>['evalEnabledByDay']
  >(
    (acc, day) => {
      acc[day] = values[AI_DAY_FIELD_MAP[day]];
      return acc;
    },
    {} as NonNullable<CreateTrialInput['ai']>['evalEnabledByDay'],
  );

  return {
    title: roleTitle,
    role: roleDescription,
    seniority: values.seniority,
    ...(values.preferredLanguageFramework.trim()
      ? {
          preferredLanguageFramework: values.preferredLanguageFramework.trim(),
        }
      : {}),
    focus: trimmedFocus ? trimmedFocus : undefined,
    companyContext:
      trimmedDomain || trimmedProductArea
        ? {
            ...(trimmedDomain ? { domain: trimmedDomain } : {}),
            ...(trimmedProductArea ? { productArea: trimmedProductArea } : {}),
          }
        : undefined,
    ai: {
      noticeVersion: values.noticeVersion.trim(),
      evalEnabledByDay,
      ...(promptOverrides ? { promptOverrides } : {}),
    },
  };
}
