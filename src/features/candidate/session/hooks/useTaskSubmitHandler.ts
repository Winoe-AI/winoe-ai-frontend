import { submitCandidateTask } from '@/features/candidate/api/tasks';
import { useNotifications } from '@/shared/notifications';
import { normalizeApiError } from '@/lib/errors/errors';
import { friendlySubmitError } from '../utils/errorMessages';
import {
  isCodeTask,
  isGithubNativeDay,
  isTextTask,
} from '../task/utils/taskGuards';
import { isDay5ReflectionTask } from '../task/utils/day5Reflection';
import {
  extractTaskWindowClosedOverride,
  formatComeBackMessage,
} from '../lib/windowState';
import type { Task, SubmitPayload } from '../task/types';

type Deps = {
  candidateSessionId: number | null;
  currentTask: Task | null;
  clearTaskError: () => void;
  setTaskError: (msg: string) => void;
  refreshTask: (opts?: { skipCache?: boolean }) => Promise<void>;
  setSubmitting: (v: boolean) => void;
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
  onTaskWindowClosed,
  onSubmissionRecorded,
  setRefreshTimer,
}: Deps) {
  const { notify } = useNotifications();

  const handleSubmit = async (payload: SubmitPayload) => {
    if (!candidateSessionId || !currentTask) return;

    const type = String(currentTask.type);
    const wantsText = isTextTask(type);
    const isCode = isCodeTask(type);
    const isGithubNative = isGithubNativeDay(currentTask.dayIndex) || isCode;
    const day5Reflection = isDay5ReflectionTask(currentTask);

    if (!isGithubNative && wantsText && !day5Reflection) {
      const trimmed = (payload.contentText ?? '').trim();
      if (!trimmed) {
        setTaskError('Please enter an answer before submitting.');
        return;
      }
    }

    setSubmitting(true);
    clearTaskError();

    try {
      const submitArgs: {
        taskId: number;
        candidateSessionId: number;
        contentText?: string;
        reflection?: SubmitPayload['reflection'];
      } = {
        taskId: currentTask.id,
        candidateSessionId,
        contentText: isGithubNative ? undefined : payload.contentText,
      };
      if (!isGithubNative && payload.reflection) {
        submitArgs.reflection = payload.reflection;
      }

      const resp = await submitCandidateTask(submitArgs);

      if (
        resp &&
        typeof resp === 'object' &&
        typeof (resp as { submissionId?: unknown }).submissionId === 'number' &&
        typeof (resp as { submittedAt?: unknown }).submittedAt === 'string'
      ) {
        onSubmissionRecorded?.({
          submissionId: (resp as { submissionId: number }).submissionId,
          submittedAt: (resp as { submittedAt: string }).submittedAt,
        });
      }

      setRefreshTimer(() => {
        void refreshTask({ skipCache: true });
      });

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
