import type { SubmissionListItem } from '../types';

const pickLatest = (candidates: SubmissionListItem[]) => {
  if (!candidates.length) return null;
  return candidates.reduce<SubmissionListItem | null>((best, cand) => {
    if (!best) return cand;
    const candTs = Date.parse(cand.submittedAt ?? '');
    const bestTs = Date.parse(best.submittedAt ?? '');
    const candValid = !Number.isNaN(candTs);
    const bestValid = !Number.isNaN(bestTs);
    if (candValid && bestValid) return candTs > bestTs ? cand : best;
    if (candValid && !bestValid) return cand;
    if (!candValid && !bestValid && cand.submissionId > best.submissionId)
      return cand;
    return best;
  }, null);
};

export const pickLatestByDay = (items: SubmissionListItem[], day: number) =>
  pickLatest(items.filter((it) => Number(it.dayIndex) === day));

export const pickLatestWhere = (
  items: SubmissionListItem[],
  predicate: (item: SubmissionListItem) => boolean,
) => pickLatest(items.filter(predicate));
