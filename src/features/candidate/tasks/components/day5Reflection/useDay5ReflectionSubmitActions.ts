import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { SubmitPayload } from '../../types';
import {
  buildDay5ReflectionPayloadFromMarkdown,
  mapDay5BackendValidationErrors,
  type Day5FieldErrors,
} from '../../utils/day5ReflectionUtils';

type UseDay5ReflectionSubmitActionsArgs = {
  readOnly: boolean;
  displayStatus: 'idle' | 'submitting' | 'submitted';
  submitting: boolean;
  markdown: string;
  hasClientValidationErrors: boolean;
  handleSubmit: (payload: SubmitPayload) => Promise<unknown>;
  getLastError: () => unknown;
  setSubmitAttempted: Dispatch<SetStateAction<boolean>>;
  setBackendFieldErrors: Dispatch<SetStateAction<Day5FieldErrors>>;
  setLocalFormError: Dispatch<SetStateAction<string | null>>;
  setSubmittedTerminal: Dispatch<SetStateAction<boolean>>;
};

export function useDay5ReflectionSubmitActions({
  readOnly,
  displayStatus,
  submitting,
  markdown,
  hasClientValidationErrors,
  handleSubmit,
  getLastError,
  setSubmitAttempted,
  setBackendFieldErrors,
  setLocalFormError,
  setSubmittedTerminal,
}: UseDay5ReflectionSubmitActionsArgs) {
  const onSubmitReflection = useCallback(async () => {
    if (readOnly || displayStatus !== 'idle' || submitting) return;
    setSubmitAttempted(true);
    setBackendFieldErrors({});
    setLocalFormError(null);
    if (hasClientValidationErrors) {
      setLocalFormError('Add reflection text before submitting.');
      return;
    }
    const reflection = buildDay5ReflectionPayloadFromMarkdown(markdown);
    const payload: SubmitPayload = {
      reflection,
      contentText: markdown,
    };
    const response = await handleSubmit(payload);
    if (response === 'submit-failed') {
      const mapped = mapDay5BackendValidationErrors(getLastError());
      if (mapped.hasValidationErrors) {
        setBackendFieldErrors(mapped.fieldErrors);
        setLocalFormError(mapped.formError);
      }
      return;
    }
    setSubmittedTerminal(true);
  }, [
    displayStatus,
    getLastError,
    handleSubmit,
    hasClientValidationErrors,
    readOnly,
    setBackendFieldErrors,
    setLocalFormError,
    setSubmitAttempted,
    setSubmittedTerminal,
    submitting,
    markdown,
  ]);

  return { onSubmitReflection };
}
