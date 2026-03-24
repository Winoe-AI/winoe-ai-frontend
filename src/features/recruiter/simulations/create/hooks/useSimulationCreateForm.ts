import { useState } from 'react';
import { createSimulation } from '@/features/recruiter/api';
import type { CreateSimulationInput } from '@/features/recruiter/api/types';
import {
  buildLoginUrl,
  buildNotAuthorizedUrl,
  buildReturnTo,
} from '@/lib/auth/routing';
import { toUserMessage } from '@/lib/errors/errors';
import {
  AI_DAY_KEYS,
  AI_DAY_FIELD_MAP,
  SENIORITY_OPTIONS,
  initialValues,
  mapSimulationValidationErrors,
  validateSimulationInput,
  type FieldErrors,
  type FormValues,
} from '../utils/createFormConfig';

export function useSimulationCreateForm(onSuccess: (id: string) => void) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = <K extends keyof FormValues>(
    key: K,
    value: FormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
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
    const payload: CreateSimulationInput = {
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
              ...(trimmedProductArea
                ? { productArea: trimmedProductArea }
                : {}),
            }
          : undefined,
      ai: {
        noticeVersion: values.noticeVersion.trim(),
        evalEnabledByDay,
      },
    };

    const nextErrors = validateSimulationInput(payload);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const res = await createSimulation(payload);

      if (!res.ok || !res.id) {
        const status = res.status ?? null;
        const returnTo = buildReturnTo();
        if (status === 401) {
          window.location.assign(buildLoginUrl('recruiter', returnTo));
          return;
        }
        if (status === 403) {
          window.location.assign(buildNotAuthorizedUrl('recruiter', returnTo));
          return;
        }
        if (status === 422) {
          const validationErrors = mapSimulationValidationErrors(res.details);
          if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
          }
        }
        const fallback = res.message
          ? res.message
          : !res.ok
            ? 'Unable to create simulation right now.'
            : 'Simulation created but no id was returned.';
        setErrors({ form: fallback });
        return;
      }

      onSuccess(res.id);
    } catch (caught: unknown) {
      setErrors({
        form: toUserMessage(
          caught,
          'Failed to create simulation. Please try again.',
          { includeDetail: true },
        ),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    values,
    errors,
    isSubmitting,
    setField,
    handleSubmit,
    seniorityOptions: SENIORITY_OPTIONS,
  };
}
