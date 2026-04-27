'use client';
import { useEffect, useMemo, useState } from 'react';
import { resolveCodingSubmissionStatus } from '../utils/submissionStatusUtils';
import type { SubmitPayload, SubmitResponse, Task } from '../types';
import type { WindowActionGate } from '@/features/candidate/session/lib/windowState';
import { useSubmitHandler } from './useTaskHooks';
import {
  resolveFinalizedText,
  type DurableCodingSubmission,
} from './useTaskSubmitControllerContent';
import { deriveTaskSubmitStatus } from './useTaskSubmitControllerStatus';
import { useTaskSubmitControllerDraft } from './useTaskSubmitControllerDraft';
import { useTaskSubmitControllerSaveAndSubmit } from './useTaskSubmitControllerSaveAndSubmit';

type Args = {
  candidateSessionId: number | null;
  task: Task;
  submitting: boolean;
  submitError?: string | null;
  actionGate: WindowActionGate;
  onTaskWindowClosed?: (err: unknown) => void;
  onSubmit: (
    payload: SubmitPayload,
  ) => Promise<SubmitResponse | void> | SubmitResponse | void;
};

export function useTaskSubmitController({
  candidateSessionId,
  task,
  submitting,
  submitError,
  actionGate,
  onTaskWindowClosed,
  onSubmit,
}: Args) {
  const { submitStatus, lastProgress, lastShaRefs, handleSubmit } =
    useSubmitHandler(onSubmit);
  const [recordedCodingSubmission, setRecordedCodingSubmission] =
    useState<DurableCodingSubmission | null>(null);
  const [localTextSubmitted, setLocalTextSubmitted] = useState(false);
  const [day1DeadlineClosed, setDay1DeadlineClosed] = useState(() => {
    if (task.dayIndex !== 1 || !task.cutoffAt) return false;
    const cutoffMs = Date.parse(task.cutoffAt);
    return Number.isFinite(cutoffMs) && Date.now() >= cutoffMs;
  });
  const finalized = useMemo(() => resolveFinalizedText(task), [task]);
  const durableCodingSubmission =
    recordedCodingSubmission?.taskId === task.id
      ? recordedCodingSubmission
      : null;
  const status = deriveTaskSubmitStatus({
    task,
    actionGate,
    submitting,
    submitStatus,
    localTextSubmitted,
    day1DeadlineClosed,
    finalizedAvailable: finalized.available,
    durableCodingSubmission,
    lastProgress,
  });
  const draft = useTaskSubmitControllerDraft({
    task,
    candidateSessionId,
    textTask: status.textTask,
    disabled: status.disabled,
    readOnly: status.readOnly,
    hasFinalizedContent: finalized.available,
    onTaskWindowClosed,
  });
  useEffect(() => {
    if (
      task.dayIndex !== 1 ||
      !task.cutoffAt ||
      day1DeadlineClosed ||
      localTextSubmitted ||
      actionGate.isReadOnly
    ) {
      return;
    }
    const cutoffMs = Date.parse(task.cutoffAt);
    if (!Number.isFinite(cutoffMs)) return;
    const delayMs = Math.max(0, cutoffMs - Date.now());
    const timerId = window.setTimeout(() => {
      void draft.draftAutosave.flushNow().finally(() => {
        setDay1DeadlineClosed(true);
      });
    }, delayMs);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [
    actionGate.isReadOnly,
    day1DeadlineClosed,
    draft.draftAutosave,
    localTextSubmitted,
    task.cutoffAt,
    task.dayIndex,
  ]);
  const { localError, saveAndSubmit } = useTaskSubmitControllerSaveAndSubmit({
    taskId: task.id,
    actionStatus: status.actionStatus,
    disabled: status.disabled,
    githubNative: status.githubNative,
    textTask: status.textTask,
    textRef: draft.textRef,
    handleSubmit,
    clearDrafts: draft.clearDrafts,
    setRecordedCodingSubmission,
    onTextSubmitted:
      task.dayIndex === 1 ? () => setLocalTextSubmitted(true) : undefined,
  });
  const codingSubmissionStatus = resolveCodingSubmissionStatus(
    task.dayIndex,
    durableCodingSubmission?.shaRefs ?? lastShaRefs,
  );

  return {
    textTask: status.textTask,
    text:
      status.textTask && status.readOnly && finalized.available
        ? finalized.text
        : draft.text,
    setText: draft.setText,
    savedAt: draft.draftAutosave.lastSavedAt,
    draftAutosaveStatus: draft.draftAutosave.status,
    draftRestoreApplied: draft.draftAutosave.restoreApplied,
    draftError: draft.draftAutosave.error,
    saveDraftNow: draft.saveDraftNow,
    actionStatus: status.actionStatus,
    displayStatus: status.displayStatus,
    lastProgress: status.statusProgress,
    githubNative: status.githubNative,
    readOnly: status.readOnly,
    disabled: status.disabled,
    disabledReason: status.readOnlyReason,
    submittedLabel: status.githubNative
      ? codingSubmissionStatus.submittedLabel
      : null,
    submittedShaLabel: status.githubNative
      ? (codingSubmissionStatus.shaMeta?.label ?? null)
      : null,
    submittedSha: status.githubNative
      ? (codingSubmissionStatus.shaMeta?.sha ?? null)
      : null,
    errorToShow: localError ?? submitError ?? null,
    saveAndSubmit,
  };
}
