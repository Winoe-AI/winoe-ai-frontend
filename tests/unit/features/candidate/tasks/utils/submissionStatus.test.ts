import { resolveCodingSubmissionStatus } from '@/features/candidate/tasks/utils/submissionStatusUtils';

describe('resolveCodingSubmissionStatus', () => {
  it('uses checkpoint label and sha for Day 2', () => {
    const result = resolveCodingSubmissionStatus(2, {
      checkpointSha: 'abc123456',
      finalSha: null,
      commitSha: 'fallback-sha',
    });

    expect(result.submittedLabel).toBe('Checkpoint recorded');
    expect(result.shaMeta).toEqual({
      label: 'Checkpoint SHA',
      sha: 'abc123456',
    });
  });

  it('falls back to neutral commit label for Day 2 when checkpoint sha is missing', () => {
    const result = resolveCodingSubmissionStatus(2, {
      checkpointSha: null,
      finalSha: null,
      commitSha: 'def123456',
    });

    expect(result.submittedLabel).toBe('Checkpoint recorded');
    expect(result.shaMeta).toEqual({
      label: 'Recorded commit',
      sha: 'def123456',
    });
  });

  it('uses final label and sha for Day 3', () => {
    const result = resolveCodingSubmissionStatus(3, {
      checkpointSha: null,
      finalSha: 'fed987654',
      commitSha: 'fallback-sha',
    });

    expect(result.submittedLabel).toBe('Final recorded');
    expect(result.shaMeta).toEqual({
      label: 'Final SHA',
      sha: 'fed987654',
    });
  });

  it('falls back to neutral commit label for Day 3 when final sha is missing', () => {
    const result = resolveCodingSubmissionStatus(3, {
      checkpointSha: null,
      finalSha: null,
      commitSha: 'zzz111222',
    });

    expect(result.submittedLabel).toBe('Final recorded');
    expect(result.shaMeta).toEqual({
      label: 'Recorded commit',
      sha: 'zzz111222',
    });
  });

  it('returns no custom status for non-coding days', () => {
    const result = resolveCodingSubmissionStatus(1, {
      checkpointSha: 'abc',
      finalSha: 'def',
      commitSha: 'ghi',
    });

    expect(result.submittedLabel).toBeNull();
    expect(result.shaMeta).toBeNull();
  });
});
