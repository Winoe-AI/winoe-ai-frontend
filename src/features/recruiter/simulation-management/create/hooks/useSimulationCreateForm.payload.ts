import type { CreateSimulationInput } from '@/features/recruiter/api/typesApi';
import {
  AI_DAY_FIELD_MAP,
  AI_DAY_KEYS,
  type FormValues,
} from '../utils/createFormConfigUtils';

export function buildSimulationCreatePayload(
  values: FormValues,
): CreateSimulationInput {
  const trimmedDomain = values.companyDomain.trim();
  const trimmedProductArea = values.companyProductArea.trim();
  const trimmedFocus = values.focus.trim();
  const evalEnabledByDay = AI_DAY_KEYS.reduce<
    NonNullable<CreateSimulationInput['ai']>['evalEnabledByDay']
  >(
    (acc, day) => {
      acc[day] = values[AI_DAY_FIELD_MAP[day]];
      return acc;
    },
    {} as NonNullable<CreateSimulationInput['ai']>['evalEnabledByDay'],
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
    },
  };
}
