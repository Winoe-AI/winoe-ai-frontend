import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { SubmitPayload } from '../../types';
import {
  buildDay5ReflectionContentText,
  buildDay5ReflectionPayload,
  mapDay5BackendValidationErrors,
  type Day5FieldErrors,
  type Day5ReflectionSectionKey,
  type Day5ReflectionSections,
} from '../../utils/day5ReflectionUtils';

type UseDay5ReflectionSubmitActionsArgs = {
  readOnly: boolean;
  displayStatus: 'idle' | 'submitting' | 'submitted';
  submitting: boolean;
  sections: Day5ReflectionSections;
  hasClientValidationErrors: boolean;
  handleSubmit: (payload: SubmitPayload) => Promise<unknown>;
  getLastError: () => unknown;
  setSections: Dispatch<SetStateAction<Day5ReflectionSections>>;
  setTouched: Dispatch<
    SetStateAction<Record<Day5ReflectionSectionKey, boolean>>
  >;
  setSubmitAttempted: Dispatch<SetStateAction<boolean>>;
  setBackendFieldErrors: Dispatch<SetStateAction<Day5FieldErrors>>;
  setLocalFormError: Dispatch<SetStateAction<string | null>>;
  setSubmittedTerminal: Dispatch<SetStateAction<boolean>>;
};

export function useDay5ReflectionSubmitActions({
  readOnly,
  displayStatus,
  submitting,
  sections,
  hasClientValidationErrors,
  handleSubmit,
  getLastError,
  setSections,
  setTouched,
  setSubmitAttempted,
  setBackendFieldErrors,
  setLocalFormError,
  setSubmittedTerminal,
}: UseDay5ReflectionSubmitActionsArgs) {
  const handleSectionChange = useCallback(
    (key: Day5ReflectionSectionKey, value: string) => {
      setSections((prev) => ({ ...prev, [key]: value }));
      setTouched((prev) => ({ ...prev, [key]: true }));
      setBackendFieldErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setLocalFormError((prev) => (prev ? null : prev));
    },
    [setBackendFieldErrors, setLocalFormError, setSections, setTouched],
  );

  const onSubmitReflection = useCallback(async () => {
    if (readOnly || displayStatus !== 'idle' || submitting) return;
    setSubmitAttempted(true);
    setBackendFieldErrors({});
    setLocalFormError(null);
    if (hasClientValidationErrors) return;
    const reflection = buildDay5ReflectionPayload(sections);
    const payload: SubmitPayload = {
      reflection,
      contentText: buildDay5ReflectionContentText(reflection),
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
    sections,
    setBackendFieldErrors,
    setLocalFormError,
    setSubmitAttempted,
    setSubmittedTerminal,
    submitting,
  ]);

  return { handleSectionChange, onSubmitReflection };
}
