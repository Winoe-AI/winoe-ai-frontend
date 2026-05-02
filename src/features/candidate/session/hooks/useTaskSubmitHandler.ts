import { submitCandidateTask } from '@/features/candidate/session/api/tasksApi';
import { useNotifications } from '@/shared/notifications';
import { normalizeApiError } from '@/platform/errors/errors';
import { friendlySubmitError } from '../utils/errorMessagesUtils';
import {
  extractTaskWindowClosedOverride,
  formatComeBackMessage,
} from '../lib/windowState';
import type { Task, SubmitPayload } from '@/features/candidate/tasks/types';
import {
  buildTaskSubmitArgs,
  shouldBlockEmptyTextSubmit,
  toRecordedSubmission,
} from './useTaskSubmitHandler.helpers';
type Deps = {
  candidateSessionId: number | null;
  currentTask: Task | null;
  clearTaskError: () => void;
  setTaskError: (msg: string) => void;
  refreshTask: (opts?: { skipCache?: boolean }) => Promise<{
    completedAt?: string | null;
  } | void>;
  setSubmitting: (v: boolean) => void;
  onCompletionRecorded?: (completedAt: string | null) => void;
  onTaskWindowClosed?: (err: unknown) => void;
  onSubmissionRecorded?: (payload: {
    submissionId: number;
    submittedAt: string;
  }) => void;
  setRefreshTimer: (cb: () => void) => void;
};

export function useTaskSubmitHandler({
  candidateSessionId,
  currentTask,
  clearTaskError,
  setTaskError,
  refreshTask,
  setSubmitting,
  onCompletionRecorded,
  onTaskWindowClosed,
  onSubmissionRecorded,
  setRefreshTimer,
}: Deps) {
  const { notify } = useNotifications();
  const handleSubmit = async (payload: SubmitPayload) => {
    if (!candidateSessionId || !currentTask) return;
    if (shouldBlockEmptyTextSubmit(currentTask, payload)) {
      setTaskError('Please enter an answer before submitting.');
      return;
    }
    setSubmitting(true);
    clearTaskError();
    try {
      const resp = await submitCandidateTask(
        buildTaskSubmitArgs(currentTask, candidateSessionId, payload),
      );
      const recordedSubmission = toRecordedSubmission(resp);
      if (recordedSubmission) {
        onSubmissionRecorded?.(recordedSubmission);
      }
      if (resp?.isComplete) {
        const responseCompletedAt =
          typeof resp.completedAt === 'string' && resp.completedAt.trim()
            ? resp.completedAt
            : null;
        if (responseCompletedAt) {
          onCompletionRecorded?.(responseCompletedAt);
        }
        const refreshedTask = await refreshTask({ skipCache: true });
        const completionAt =
          responseCompletedAt ??
          (refreshedTask &&
          typeof refreshedTask === 'object' &&
          typeof refreshedTask.completedAt === 'string' &&
          refreshedTask.completedAt.trim()
            ? refreshedTask.completedAt
            : null);
        if (completionAt && completionAt !== responseCompletedAt) {
          onCompletionRecorded?.(completionAt);
        }
        setRefreshTimer(() => {
          void refreshTask({ skipCache: true });
        });
      } else {
        setRefreshTimer(() => {
          void refreshTask({ skipCache: true });
        });
      }
      notify({
        id: `submit-${currentTask.id}`,
        tone: 'success',
        title: 'Submission received',
        description: 'We are refreshing your progress.',
      });
      return resp;
    } catch (err) {
      const windowClosed = extractTaskWindowClosedOverride(err);
      if (windowClosed) {
        onTaskWindowClosed?.(err);
      }
      const normalized = normalizeApiError(
        err,
        friendlySubmitError(err) ?? 'Submission failed.',
      );
      setTaskError(
        windowClosed ? formatComeBackMessage(windowClosed) : normalized.message,
      );
      notify({
        id: `submit-${currentTask?.id ?? 'unknown'}`,
        tone: 'error',
        title: 'Submission failed',
        description: normalized.message,
      });
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  return { handleSubmit };
}
