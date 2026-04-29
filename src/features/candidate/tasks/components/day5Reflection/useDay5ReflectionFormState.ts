import { useCallback, useDeferredValue, useState, useTransition } from 'react';
import { useSubmitHandler } from '../../hooks/useSubmitHandler';
import {
  buildDay5ReflectionMarkdownTemplate,
  extractDay5SectionsFromContentJson,
  buildDay5ReflectionContentText,
  hasMeaningfulDay5ReflectionMarkdown,
  type Day5FieldErrors,
} from '../../utils/day5ReflectionUtils';
import {
  deriveDay5ErrorToShow,
  deriveDisplayStatus,
  deriveReadOnlyReason,
} from './day5ReflectionFormDerived';
import type { UseDay5ReflectionFormStateArgs } from './day5ReflectionForm.types';
import { useDay5ReflectionDraftAutosave } from './useDay5ReflectionDraftAutosave';
import { useDay5ReflectionSubmitActions } from './useDay5ReflectionSubmitActions';

function extractInitialMarkdown(
  task: UseDay5ReflectionFormStateArgs['task'],
): string {
  const recordedSubmission = task.recordedSubmission ?? null;
  const contentText =
    typeof recordedSubmission?.contentText === 'string'
      ? recordedSubmission.contentText
      : '';
  if (contentText.trim()) return contentText;

  const structured = extractDay5SectionsFromContentJson(
    recordedSubmission?.contentJson,
  );
  const hasStructuredContent = Object.values(structured).some(
    (value) => value.trim().length > 0,
  );
  if (hasStructuredContent) {
    return buildDay5ReflectionContentText(structured);
  }

  return buildDay5ReflectionMarkdownTemplate();
}

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
  const hasRecordedSubmission = Boolean(recordedSubmission?.submittedAt);
  const [markdown, setMarkdown] = useState(() => extractInitialMarkdown(task));
  const [mode, setMode] = useState<'write' | 'preview'>('write');
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
    comeBackAt: actionGate.comeBackAt,
    submittedTerminal,
  });
  const displayStatus = deriveDisplayStatus({
    submitting,
    submittedTerminal,
    submitStatus,
  });
  const hasClientValidationErrors =
    !hasMeaningfulDay5ReflectionMarkdown(markdown);
  const markdownPreview = useDeferredValue(markdown);
  const draftAutosave = useDay5ReflectionDraftAutosave({
    taskId: task.id,
    candidateSessionId,
    readOnly,
    markdown,
    onTaskWindowClosed,
    onRestore: setMarkdown,
  });
  const { onSubmitReflection } = useDay5ReflectionSubmitActions({
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
  });

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
    readOnlyMarkdown: markdown,
    mode,
    handleModeChange,
    previewPending,
    markdown,
    markdownPreview,
    submitAttempted,
    backendFieldErrors,
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
    handleMarkdownChange: setMarkdown,
    onSaveDraft: () => void draftAutosave.flushNow(),
    onSubmitReflection,
  };
}
