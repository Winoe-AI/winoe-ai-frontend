import type { SubmissionArtifact, SubmissionListItem } from '../types';
import { isHandoffSubmissionItem } from '../utils/handoffUtils';
import { pickLatestByDay, pickLatestWhere } from '../utils/pickLatestUtils';

export function computeLatestArtifacts(
  items: SubmissionListItem[],
  artifacts: Record<number, SubmissionArtifact>,
) {
  const latest2 = pickLatestByDay(items, 2);
  const latest3 = pickLatestByDay(items, 3);
  const latestDay4Handoff = pickLatestWhere(items, isHandoffSubmissionItem);
  return {
    latestDay2: latest2 ? (artifacts[latest2.submissionId] ?? null) : null,
    latestDay3: latest3 ? (artifacts[latest3.submissionId] ?? null) : null,
    latestDay4Handoff: latestDay4Handoff
      ? (artifacts[latestDay4Handoff.submissionId] ?? null)
      : null,
  };
}
