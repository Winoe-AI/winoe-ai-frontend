import { useCallback, useMemo, useState } from 'react';
import {
  areWorkspaceStatusesEqual,
  getCodingWorkspace,
  type CodingWorkspaceSnapshot,
} from '@/features/candidate/tasks/utils/codingWorkspaceUtils';

type WorkspaceByDay = {
  day2: CodingWorkspaceSnapshot['workspace'];
  day3: CodingWorkspaceSnapshot['workspace'];
};

const EMPTY_WORKSPACE: WorkspaceByDay = { day2: null, day3: null };

export function useCodingWorkspaceSync() {
  const [codingWorkspaceByDay, setCodingWorkspaceByDay] =
    useState<WorkspaceByDay>(EMPTY_WORKSPACE);

  const onCodingWorkspaceSnapshot = useCallback(
    (snapshot: CodingWorkspaceSnapshot) => {
      const dayKey = snapshot.dayIndex === 2 ? 'day2' : 'day3';
      setCodingWorkspaceByDay((prev) => {
        if (areWorkspaceStatusesEqual(prev[dayKey], snapshot.workspace))
          return prev;
        return { ...prev, [dayKey]: snapshot.workspace };
      });
    },
    [],
  );

  const resetCodingWorkspace = useCallback(() => {
    setCodingWorkspaceByDay(EMPTY_WORKSPACE);
  }, []);

  const codingWorkspace = useMemo(
    () =>
      getCodingWorkspace({
        day2Workspace: codingWorkspaceByDay.day2,
        day3Workspace: codingWorkspaceByDay.day3,
      }),
    [codingWorkspaceByDay.day2, codingWorkspaceByDay.day3],
  );

  return { codingWorkspace, onCodingWorkspaceSnapshot, resetCodingWorkspace };
}
