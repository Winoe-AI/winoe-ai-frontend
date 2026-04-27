import {
  isCodeTask,
  isGithubNativeDay,
  isTextTask,
} from '../utils/taskGuardsUtils';
import { isPastTaskCutoff } from '../utils/taskCutoffUtils';
import type { Task } from '../types';
import type { WindowActionGate } from '@/features/candidate/session/lib/windowState';
import type { DurableCodingSubmission } from './useTaskSubmitControllerContent';

type DeriveTaskSubmitStatusArgs = {
  task: Task;
  actionGate: WindowActionGate;
  submitting: boolean;
  submitStatus: 'idle' | 'submitting' | 'submitted';
  localTextSubmitted: boolean;
  day1DeadlineClosed: boolean;
  finalizedAvailable: boolean;
  durableCodingSubmission: DurableCodingSubmission | null;
  lastProgress: { completed: number; total: number } | null;
};

export function deriveTaskSubmitStatus({
  task,
  actionGate,
  submitting,
  submitStatus,
  localTextSubmitted,
  day1DeadlineClosed,
  finalizedAvailable,
  durableCodingSubmission,
  lastProgress,
}: DeriveTaskSubmitStatusArgs) {
  const githubNative =
    isGithubNativeDay(task.dayIndex) || isCodeTask(task.type);
  const textTask = !githubNative && isTextTask(task.type);
  const actionStatus = submitting ? 'submitting' : submitStatus;
  const cutoffClosed = githubNative && isPastTaskCutoff(task.cutoffAt);
  const statusHasDurableRecord = Boolean(
    task.recordedSubmission || durableCodingSubmission,
  );
  const textSubmissionRecorded =
    textTask &&
    task.dayIndex === 1 &&
    Boolean(task.recordedSubmission && finalizedAvailable);
  const readOnly =
    actionGate.isReadOnly ||
    cutoffClosed ||
    (textTask &&
      (localTextSubmitted || textSubmissionRecorded || day1DeadlineClosed));
  const disabled = Boolean(
    readOnly || submitting || submitStatus === 'submitted',
  );
  const disabledReason = readOnly
    ? (actionGate.disabledReason ??
      (cutoffClosed
        ? 'Day closed. The Codespace is read-only after cutoff.'
        : day1DeadlineClosed
          ? 'Day 1 closed at the 5 PM deadline. The Day 1 design document is locked.'
          : localTextSubmitted || textSubmissionRecorded
            ? task.dayIndex === 1
              ? 'Day 1 design document submitted. Editing is locked.'
              : 'Submitted. Editing is locked.'
            : null))
    : null;
  const displayStatus =
    localTextSubmitted ||
    textSubmissionRecorded ||
    (githubNative &&
      actionStatus !== 'submitting' &&
      (actionStatus === 'submitted' || statusHasDurableRecord))
      ? 'submitted'
      : actionStatus;
  const statusProgress =
    githubNative && durableCodingSubmission?.progress
      ? durableCodingSubmission.progress
      : lastProgress;
  const readOnlyReason =
    readOnly && textTask
      ? (disabledReason ??
        (finalizedAvailable
          ? 'This day is closed and read-only. Finalized submission content is shown below.'
          : 'This day is closed and read-only. Finalized submission content is not available for this task.'))
      : disabledReason;

  return {
    githubNative,
    textTask,
    actionStatus,
    readOnly,
    disabled,
    displayStatus,
    statusProgress,
    readOnlyReason,
  };
}
