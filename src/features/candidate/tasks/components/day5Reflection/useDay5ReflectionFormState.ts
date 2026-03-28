import {
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
  useTransition,
} from 'react';
import { useSubmitHandler } from '../../hooks/useSubmitHandler';
import {
  buildDay5ReflectionContentText,
  buildDay5ReflectionPayload,
  day5ValidationMessages,
  emptyDay5ReflectionSections,
  extractDay5SectionsFromContentJson,
  type Day5FieldErrors,
  type Day5ReflectionSectionKey,
  hasDay5SectionContent,
  hasDay5ValidationErrors,
  validateDay5ReflectionSections,
} from '../../utils/day5ReflectionUtils';
import {
  deriveDay5ErrorToShow,
  deriveDisplayStatus,
  deriveReadOnlyContent,
  deriveReadOnlyReason,
} from './day5ReflectionFormDerived';
import {
  emptyTouchedMap,
  type UseDay5ReflectionFormStateArgs,
} from './day5ReflectionForm.types';
import { useDay5ReflectionDraftAutosave } from './useDay5ReflectionDraftAutosave';
import { useDay5ReflectionSubmitActions } from './useDay5ReflectionSubmitActions';

export function useDay5ReflectionFormState({
  candidateSessionId,
  task,
  submitting,
  submitError,
  actionGate,
  onTaskWindowClosed,
  onSubmit,
}: UseDay5ReflectionFormStateArgs) {
  const recordedSubmission = task.recordedSubmission ?? null;
  const recordedSections = useMemo(
    () => extractDay5SectionsFromContentJson(recordedSubmission?.contentJson),
    [recordedSubmission?.contentJson],
  );
  const hasStructuredRecordedContent = useMemo(
    () => hasDay5SectionContent(recordedSections),
    [recordedSections],
  );
  const recordedContentText =
    typeof recordedSubmission?.contentText === 'string'
      ? recordedSubmission.contentText
      : '';
  const hasRecordedSubmission = Boolean(recordedSubmission?.submittedAt);
  const [sections, setSections] = useState(
    hasStructuredRecordedContent
      ? recordedSections
      : emptyDay5ReflectionSections(),
  );
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [touched, setTouched] = useState(emptyTouchedMap());
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [backendFieldErrors, setBackendFieldErrors] = useState<Day5FieldErrors>(
    {},
  );
  const [localFormError, setLocalFormError] = useState<string | null>(null);
  const [submittedTerminal, setSubmittedTerminal] = useState(
    hasRecordedSubmission,
  );
  const [previewPending, startPreviewTransition] = useTransition();
  const { submitStatus, lastProgress, getLastError, handleSubmit } =
    useSubmitHandler(onSubmit);
  const readOnly = actionGate.isReadOnly || submittedTerminal;
  const readOnlyReason = deriveReadOnlyReason({
    actionGateReadOnly: actionGate.isReadOnly,
    actionGateReason: actionGate.disabledReason ?? null,
    submittedTerminal,
  });
  const validationCodes = useMemo(
    () => validateDay5ReflectionSections(sections),
    [sections],
  );
  const clientFieldMessages = useMemo(
    () => day5ValidationMessages(validationCodes),
    [validationCodes],
  );
  const hasClientValidationErrors = hasDay5ValidationErrors(validationCodes);
  const displayStatus = deriveDisplayStatus({
    submitting,
    submittedTerminal,
    submitStatus,
  });
  const draftAutosave = useDay5ReflectionDraftAutosave({
    taskId: task.id,
    candidateSessionId,
    readOnly,
    sections,
    onTaskWindowClosed,
    setters: {
      setSections,
      setTouched,
      setSubmitAttempted,
      setBackendFieldErrors,
      setLocalFormError,
    },
  });
  const deferredSections = useDeferredValue(sections);
  const markdownPreview = useMemo(
    () =>
      mode === 'preview'
        ? buildDay5ReflectionContentText(
            buildDay5ReflectionPayload(deferredSections),
          )
        : '',
    [deferredSections, mode],
  );
  const { readOnlySections, readOnlyFallbackMarkdown } = deriveReadOnlyContent({
    actionGateReadOnly: actionGate.isReadOnly,
    hasRecordedSubmission,
    hasStructuredRecordedContent,
    recordedContentText,
    recordedSections,
    sections,
  });
  const { handleSectionChange, onSubmitReflection } =
    useDay5ReflectionSubmitActions({
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
    });
  const handleSectionBlur = useCallback(
    (key: Day5ReflectionSectionKey) =>
      setTouched((prev) => ({ ...prev, [key]: true })),
    [],
  );
  const handleModeChange = useCallback(
    (next: 'write' | 'preview') => startPreviewTransition(() => setMode(next)),
    [startPreviewTransition],
  );
  const submitDisabled =
    readOnly ||
    displayStatus !== 'idle' ||
    submitting ||
    hasClientValidationErrors;

  return {
    readOnly,
    readOnlyReason,
    readOnlySections,
    readOnlyFallbackMarkdown,
    mode,
    handleModeChange,
    previewPending,
    markdownPreview,
    submitAttempted,
    touched,
    backendFieldErrors,
    clientFieldMessages,
    sections,
    displayStatus,
    draftAutosave,
    hasClientValidationErrors,
    submittedTerminal,
    lastProgress,
    errorToShow: deriveDay5ErrorToShow({
      localFormError,
      backendFieldErrors,
      submitError,
    }),
    submitDisabled,
    handleSectionChange,
    handleSectionBlur,
    onSaveDraft: () => void draftAutosave.flushNow(),
    onSubmitReflection,
  };
}
