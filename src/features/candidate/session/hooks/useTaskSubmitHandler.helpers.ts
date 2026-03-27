import {
  isCodeTask,
  isGithubNativeDay,
  isTextTask,
} from '../task/utils/taskGuards';
import { isDay5ReflectionTask } from '../task/utils/day5Reflection';
import type { SubmitPayload, Task } from '../task/types';

type SubmitArgs = {
  taskId: number;
  candidateSessionId: number;
  contentText?: string;
  reflection?: SubmitPayload['reflection'];
};

export function shouldBlockEmptyTextSubmit(
  currentTask: Task,
  payload: SubmitPayload,
): boolean {
  const type = String(currentTask.type);
  const wantsText = isTextTask(type);
  const isCode = isCodeTask(type);
  const isGithubNative = isGithubNativeDay(currentTask.dayIndex) || isCode;
  const day5Reflection = isDay5ReflectionTask(currentTask);
  if (isGithubNative || !wantsText || day5Reflection) return false;
  return (payload.contentText ?? '').trim().length === 0;
}

export function buildTaskSubmitArgs(
  currentTask: Task,
  candidateSessionId: number,
  payload: SubmitPayload,
): SubmitArgs {
  const isCode = isCodeTask(String(currentTask.type));
  const isGithubNative = isGithubNativeDay(currentTask.dayIndex) || isCode;
  const submitArgs: SubmitArgs = {
    taskId: currentTask.id,
    candidateSessionId,
    contentText: isGithubNative ? undefined : payload.contentText,
  };
  if (!isGithubNative && payload.reflection) {
    submitArgs.reflection = payload.reflection;
  }
  return submitArgs;
}

export function toRecordedSubmission(
  response: unknown,
): { submissionId: number; submittedAt: string } | null {
  if (!response || typeof response !== 'object') return null;
  const candidate = response as { submissionId?: unknown; submittedAt?: unknown };
  if (
    typeof candidate.submissionId === 'number' &&
    typeof candidate.submittedAt === 'string'
  ) {
    return {
      submissionId: candidate.submissionId,
      submittedAt: candidate.submittedAt,
    };
  }
  return null;
}
