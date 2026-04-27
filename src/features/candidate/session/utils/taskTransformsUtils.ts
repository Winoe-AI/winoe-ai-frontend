import type { CandidateCurrentTaskResponse } from '@/features/candidate/session/api';
import type { Task } from '@/features/candidate/tasks/types';
import { withDay3ImplementationWrapUpCopy } from '@/features/candidate/tasks/utils/day3ImplementationWrapUpUtils';

export function normalizeCompletedTaskIds(
  dto: CandidateCurrentTaskResponse,
): number[] {
  const root = dto.completedTaskIds;
  const nested = dto.progress?.completedTaskIds;

  if (Array.isArray(root)) return root;
  if (Array.isArray(nested)) return nested;
  return [];
}

export function toTask(
  dtoTask: CandidateCurrentTaskResponse['currentTask'],
): Task | null {
  if (!dtoTask) return null;
  return withDay3ImplementationWrapUpCopy({
    id: dtoTask.id,
    dayIndex: dtoTask.dayIndex,
    type: dtoTask.type,
    title: dtoTask.title,
    description: dtoTask.description,
    recordedSubmission: dtoTask.recordedSubmission ?? null,
    cutoffCommitSha: dtoTask.cutoffCommitSha ?? null,
    cutoffAt: dtoTask.cutoffAt ?? null,
  });
}

export function deriveCurrentDayIndex(
  completedCount: number,
  currentTask: Task | null,
  isComplete: boolean,
): number {
  if (isComplete) return 5;
  if (currentTask?.dayIndex) return currentTask.dayIndex;
  return Math.min(completedCount + 1, 5);
}
