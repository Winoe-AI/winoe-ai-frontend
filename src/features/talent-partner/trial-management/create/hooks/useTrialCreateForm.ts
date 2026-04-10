import { useState } from 'react';
import { createTrial } from '@/features/talent-partner/api';
import type {
  TrialPromptOverrideField,
  TrialPromptOverrideKey,
} from '@/features/talent-partner/api';
import { toUserMessage } from '@/platform/errors/errors';
import {
  SENIORITY_OPTIONS,
  initialValues,
  validateTrialInput,
  type FieldErrors,
  type FormValues,
} from '../utils/createFormConfigUtils';
import { buildTrialCreatePayload } from './useTrialCreateForm.payload';
import { handleTrialCreateFailure } from './useTrialCreateForm.response';

export function useTrialCreateForm(onSuccess: (id: string) => void) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = <K extends keyof FormValues>(
    key: K,
    value: FormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const setPromptOverride = (
    key: TrialPromptOverrideKey,
    field: TrialPromptOverrideField,
    value: string,
  ) => {
    setValues((prev) => ({
      ...prev,
      promptOverrides: {
        ...prev.promptOverrides,
        [key]: {
          ...prev.promptOverrides[key],
          [field]: value,
        },
      },
    }));
  };

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    const payload = buildTrialCreatePayload(values);

    const nextErrors = validateTrialInput(payload);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const res = await createTrial(payload);

      if (!res.ok || !res.id) {
        handleTrialCreateFailure({ result: res, setErrors });
        return;
      }

      onSuccess(res.id);
    } catch (caught: unknown) {
      setErrors({
        form: toUserMessage(
          caught,
          'Failed to create trial. Please try again.',
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
    setPromptOverride,
    handleSubmit,
    seniorityOptions: SENIORITY_OPTIONS,
  };
}
