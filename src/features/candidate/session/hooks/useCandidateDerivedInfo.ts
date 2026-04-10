import { useMemo } from 'react';
import {
  INVITE_EXPIRED_MESSAGE,
  INVITE_UNAVAILABLE_MESSAGE,
} from '@/platform/copy/invite';
import { deriveCurrentDayIndex } from '../utils/taskTransformsUtils';
import { extractFirstUrl } from '../utils/extractUrlUtils';
import type { CandidateSessionState } from '../CandidateSessionProvider';

export function useCandidateDerivedInfo(
  state: CandidateSessionState,
  errorStatus: number | null,
  errorMessage: string | null,
  options?: {
    currentTask?: CandidateSessionState['taskState']['currentTask'];
  },
) {
  const currentTask =
    options && options.currentTask !== undefined
      ? options.currentTask
      : state.taskState.currentTask;
  const completedCount = state.taskState.completedTaskIds.length;
  const isComplete =
    state.taskState.isComplete || state.bootstrap?.status === 'completed';
  const currentDayIndex = useMemo(
    () => deriveCurrentDayIndex(completedCount, currentTask, isComplete),
    [completedCount, currentTask, isComplete],
  );

  const showWorkspacePanel = Boolean(
    currentTask && (currentTask.dayIndex === 2 || currentTask.dayIndex === 3),
  );
  const showRecordingPanel =
    currentTask?.dayIndex === 4 && currentTask?.type !== 'handoff';
  const showDocsPanel =
    currentTask?.dayIndex === 5 || currentTask?.type === 'documentation';
  const resourceLink = useMemo(
    () => extractFirstUrl(currentTask?.description ?? null),
    [currentTask?.description],
  );

  const inviteErrorCopy =
    errorMessage ??
    (errorStatus === 410 ? INVITE_EXPIRED_MESSAGE : INVITE_UNAVAILABLE_MESSAGE);

  return {
    currentTask,
    completedCount,
    isComplete,
    currentDayIndex,
    showWorkspacePanel,
    showRecordingPanel,
    showDocsPanel,
    resourceLink,
    inviteErrorCopy,
    title: state.bootstrap?.trial?.title ?? '',
    role: state.bootstrap?.trial?.role ?? '',
  };
}
