import { useState } from 'react';
import { createSimulation } from '@/features/recruiter/api';
import type {
  SimulationPromptOverrideField,
  SimulationPromptOverrideKey,
} from '@/features/recruiter/api';
import { toUserMessage } from '@/platform/errors/errors';
import {
  SENIORITY_OPTIONS,
  initialValues,
  validateSimulationInput,
  type FieldErrors,
  type FormValues,
} from '../utils/createFormConfigUtils';
import { buildSimulationCreatePayload } from './useSimulationCreateForm.payload';
import { handleSimulationCreateFailure } from './useSimulationCreateForm.response';

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

  const setPromptOverride = (
    key: SimulationPromptOverrideKey,
    field: SimulationPromptOverrideField,
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
    const payload = buildSimulationCreatePayload(values);

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
        handleSimulationCreateFailure({ result: res, setErrors });
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
    setPromptOverride,
    handleSubmit,
    seniorityOptions: SENIORITY_OPTIONS,
  };
}
