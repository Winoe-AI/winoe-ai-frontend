import { computeLatestArtifacts } from '@/features/recruiter/submission-review/hooks/useComputeLatestArtifacts';
import type {
  SubmissionArtifact,
  SubmissionListItem,
} from '@/features/recruiter/submission-review/types';

const buildListItem = (
  submissionId: number,
  dayIndex: number,
  type: string,
  submittedAt: string,
): SubmissionListItem => ({
  submissionId,
  candidateSessionId: 900,
  taskId: submissionId,
  dayIndex,
  type,
  submittedAt,
});

const buildArtifact = (
  submissionId: number,
  dayIndex: number,
  type: string,
): SubmissionArtifact => ({
  submissionId,
  candidateSessionId: 900,
  task: {
    taskId: submissionId,
    dayIndex,
    type,
    title: `Task ${submissionId}`,
    prompt: null,
  },
  contentText: null,
  testResults: null,
  submittedAt: '2026-03-10T10:00:00.000Z',
});

describe('computeLatestArtifacts', () => {
  it('selects the latest actual handoff artifact, not the latest arbitrary Day 4 submission', () => {
    const items: SubmissionListItem[] = [
      buildListItem(20, 4, 'code', '2026-03-10T11:00:00.000Z'),
      buildListItem(21, 4, 'handoff', '2026-03-10T09:00:00.000Z'),
      buildListItem(22, 4, 'handoff', '2026-03-10T10:00:00.000Z'),
      buildListItem(30, 2, 'code', '2026-03-10T08:00:00.000Z'),
      buildListItem(31, 3, 'debug', '2026-03-10T08:30:00.000Z'),
    ];
    const artifacts: Record<number, SubmissionArtifact> = {
      22: buildArtifact(22, 4, 'handoff'),
      30: buildArtifact(30, 2, 'code'),
      31: buildArtifact(31, 3, 'debug'),
    };

    const result = computeLatestArtifacts(items, artifacts);

    expect(result.latestDay4Handoff?.submissionId).toBe(22);
    expect(result.latestDay2?.submissionId).toBe(30);
    expect(result.latestDay3?.submissionId).toBe(31);
  });

  it('returns null for latestDay4Handoff when only non-handoff Day 4 submissions exist', () => {
    const items: SubmissionListItem[] = [
      buildListItem(40, 4, 'code', '2026-03-10T10:00:00.000Z'),
      buildListItem(41, 4, 'design', '2026-03-10T11:00:00.000Z'),
    ];
    const artifacts: Record<number, SubmissionArtifact> = {
      40: buildArtifact(40, 4, 'code'),
      41: buildArtifact(41, 4, 'design'),
    };

    const result = computeLatestArtifacts(items, artifacts);

    expect(result.latestDay4Handoff).toBeNull();
  });
});
