import type { CreateTrialInput } from '@/features/talent-partner/api/typesApi';
import { buildPromptOverridePayload } from '@/features/talent-partner/ai/promptOverrideFormUtils';
import {
  AI_DAY_FIELD_MAP,
  AI_DAY_KEYS,
  type FormValues,
} from '../utils/createFormConfigUtils';

export function buildTrialCreatePayload(values: FormValues): CreateTrialInput {
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
    title: values.title.trim(),
    role: values.role.trim(),
    techStack: values.techStack.trim(),
    seniority: values.seniority,
    templateKey: values.templateKey,
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
