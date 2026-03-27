import { useMemo } from 'react';
import type { SubmissionListItem } from '../types';
import { isHandoffSubmissionItem } from '../utils/handoff';
import { pickLatestByDay, pickLatestWhere } from '../utils/pickLatest';

export function useCandidateLatestSubmissionIds(items: SubmissionListItem[]) {
  const latestGithubSubmissionIds = useMemo(() => {
    const latestDay2 = pickLatestByDay(items, 2)?.submissionId ?? null;
    const latestDay3 = pickLatestByDay(items, 3)?.submissionId ?? null;
    return [latestDay2, latestDay3].filter(
      (id): id is number => typeof id === 'number',
    );
  }, [items]);

  const latestDay4SubmissionId = useMemo(
    () => pickLatestWhere(items, isHandoffSubmissionItem)?.submissionId ?? null,
    [items],
  );

  return { latestGithubSubmissionIds, latestDay4SubmissionId };
}
