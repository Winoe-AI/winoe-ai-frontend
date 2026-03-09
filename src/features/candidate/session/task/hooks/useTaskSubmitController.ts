'use client';
import { useCallback, useMemo, useState } from 'react';
import { markTextDraftSavedAt } from '../utils/draftStorage';
import { useSubmitHandler } from './taskHooks';
import { useTaskDraftAutosave } from './useTaskDraftAutosave';
import {
  isCodeTask,
  isGithubNativeDay,
  isSubmitResponse,
  isTextTask,
} from '../utils/taskGuards';
import { resolveCodingSubmissionStatus } from '../utils/submissionStatus';
import type { SubmitPayload, SubmitResponse, Task } from '../types';
import type { WindowActionGate } from '../../lib/windowState';

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

type CodingShaRefs = {
  checkpointSha: string | null;
  finalSha: string | null;
  commitSha: string | null;
};

type DurableCodingSubmission = {
  taskId: number;
  progress: { completed: number; total: number } | null;
  shaRefs: CodingShaRefs;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toCodingShaRefs(response: SubmitResponse): CodingShaRefs {
  return {
    checkpointSha: toNullableString(response.checkpointSha),
    finalSha: toNullableString(response.finalSha),
    commitSha: toNullableString(response.commitSha),
  };
}

function pickTextFromStructuredJson(value: unknown): string | null {
  const root = asRecord(value);
  if (!root) return null;

  const directKeys = [
    'reflectionMarkdown',
    'markdown',
    'reflection',
    'content',
  ];
  for (const key of directKeys) {
    const candidate = root[key];
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
  }

  const sections = asRecord(root.sections);
  if (sections) {
    const chunks = Object.values(sections)
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter(Boolean);
    if (chunks.length > 0) return chunks.join('\n\n');
  }

  return null;
}

function resolveFinalizedText(task: Task): {
  text: string;
  available: boolean;
} {
  const recorded = task.recordedSubmission;
  if (!recorded) return { text: '', available: false };

  if (
    typeof recorded.contentText === 'string' &&
    recorded.contentText.length > 0
  ) {
    return { text: recorded.contentText, available: true };
  }

  const structured = pickTextFromStructuredJson(recorded.contentJson);
  if (structured !== null) return { text: structured, available: true };

  return { text: '', available: false };
}

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
  const [text, setText] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const githubNative = useMemo(
    () => isGithubNativeDay(task.dayIndex) || isCodeTask(task.type),
    [task.dayIndex, task.type],
  );
  const textTask = !githubNative && isTextTask(task.type);

  const actionStatus = submitting ? 'submitting' : submitStatus;

  const readOnly = actionGate.isReadOnly;
  const disabled = Boolean(
    readOnly || submitting || submitStatus === 'submitted',
  );
  const disabledReason = readOnly ? actionGate.disabledReason : null;

  const finalized = useMemo(() => resolveFinalizedText(task), [task]);
  const durableCodingSubmission =
    recordedCodingSubmission && recordedCodingSubmission.taskId === task.id
      ? recordedCodingSubmission
      : null;
  const statusHasDurableRecord = Boolean(
    task.recordedSubmission || durableCodingSubmission,
  );
  const displayStatus =
    githubNative &&
    actionStatus !== 'submitting' &&
    (actionStatus === 'submitted' || statusHasDurableRecord)
      ? 'submitted'
      : actionStatus;
  const statusProgress =
    githubNative && durableCodingSubmission?.progress
      ? durableCodingSubmission.progress
      : lastProgress;

  const draftAutosave = useTaskDraftAutosave<string>({
    taskId: task.id,
    candidateSessionId,
    isEditable: textTask && !disabled,
    hasFinalizedContent: !textTask || readOnly,
    value: text,
    serialize: useCallback(
      (value: string) => {
        if (task.dayIndex === 5) {
          return {
            contentText: value,
            contentJson: { reflectionMarkdown: value },
          };
        }
        return { contentText: value };
      },
      [task.dayIndex],
    ),
    deserialize: useCallback(
      (draft) => {
        if (task.dayIndex === 5) {
          const structured = pickTextFromStructuredJson(draft.contentJson);
          if (structured && structured.trim()) return structured;
        }
        const textValue = draft.contentText ?? '';
        return textValue.trim() ? textValue : null;
      },
      [task.dayIndex],
    ),
    onRestore: setText,
    onTaskWindowClosed,
    onSavedAt: useCallback(
      (savedAtMs: number) => {
        markTextDraftSavedAt(task.id, savedAtMs);
      },
      [task.id],
    ),
  });

  const saveDraftNow = () => {
    void draftAutosave.flushNow();
  };
  const clearDrafts = () => {};

  const textForRender = textTask && readOnly ? finalized.text : text;
  const readOnlyReason =
    readOnly && textTask
      ? (disabledReason ??
        (finalized.available
          ? 'This day is closed and read-only. Finalized submission content is shown below.'
          : 'This day is closed and read-only. Finalized submission content is not available for this task.'))
      : disabledReason;

  const saveAndSubmit = async () => {
    if (disabled || actionStatus !== 'idle') return;

    if (githubNative) {
      setLocalError(null);
      const resp = await handleSubmit({});
      if (isSubmitResponse(resp)) {
        setRecordedCodingSubmission({
          taskId: task.id,
          progress: resp.progress,
          shaRefs: toCodingShaRefs(resp),
        });
      }
      if (resp !== 'submit-failed') clearDrafts();
      return;
    }

    if (textTask) {
      const trimmed = text.trim();
      if (!trimmed) {
        setLocalError('Please enter an answer before submitting.');
        return;
      }
      setLocalError(null);
      const resp = await handleSubmit({ contentText: trimmed });
      if (resp !== 'submit-failed') clearDrafts();
      return;
    }

    setLocalError(null);
    const resp = await handleSubmit({});
    if (resp !== 'submit-failed') clearDrafts();
  };

  const errorToShow = localError ?? submitError ?? null;
  const codingSubmissionStatus = resolveCodingSubmissionStatus(
    task.dayIndex,
    durableCodingSubmission?.shaRefs ?? lastShaRefs,
  );

  return {
    textTask,
    text: textForRender,
    setText,
    savedAt: draftAutosave.lastSavedAt,
    draftAutosaveStatus: draftAutosave.status,
    draftRestoreApplied: draftAutosave.restoreApplied,
    draftError: draftAutosave.error,
    saveDraftNow,
    actionStatus,
    displayStatus,
    lastProgress: statusProgress,
    githubNative,
    readOnly,
    disabled,
    disabledReason: readOnlyReason,
    submittedLabel: githubNative ? codingSubmissionStatus.submittedLabel : null,
    submittedShaLabel: githubNative
      ? (codingSubmissionStatus.shaMeta?.label ?? null)
      : null,
    submittedSha: githubNative
      ? (codingSubmissionStatus.shaMeta?.sha ?? null)
      : null,
    errorToShow,
    saveAndSubmit,
  };
}
