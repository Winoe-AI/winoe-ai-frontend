import React from 'react';

export const listTrialCandidatesMock = jest.fn();
export const talentPartnerGetMock = jest.fn();
export const useParamsMock = jest.fn(() => ({
  id: 'trial-1',
  candidateSessionId: '123',
}));

jest.mock('next/navigation', () => ({ useParams: () => useParamsMock() }));
jest.mock('@/features/talent-partner/api', () => ({
  listTrialCandidates: (...args: unknown[]) => listTrialCandidatesMock(...args),
}));
jest.mock('@/platform/api-client/client', () => {
  const actual = jest.requireActual('@/platform/api-client/client');
  return {
    ...actual,
    talentPartnerBffClient: {
      get: (...args: unknown[]) => talentPartnerGetMock(...args),
    },
  };
});
jest.mock(
  'next/dynamic',
  () =>
    (
      _importer: () => Promise<unknown>,
      opts: { loading?: () => React.ReactElement },
    ) => {
      const Mock: React.FC<{ content?: string }> = (props) => (
        <div data-testid="md-preview">{props.content}</div>
      );
      const withStatics = Mock as React.FC<{ content?: string }> & {
        loading?: () => React.ReactElement;
      };
      withStatics.loading = opts?.loading;
      return withStatics;
    },
);

export const buildArtifact = (id: number, dayIndex: number) => ({
  submissionId: id,
  candidateSessionId: 123,
  task: {
    taskId: 10 + id,
    dayIndex,
    type: 'code',
    title: `Task ${id}`,
    prompt: 'prompt',
  },
  contentText: 'answer',
  repoUrl: 'https://github.com/winoe/repo',
  repoFullName: 'winoe/repo',
  workflowUrl: 'http://wf',
  commitUrl: 'http://commit',
  diffUrl: null,
  diffSummary: { files: 1 },
  testResults: {
    passed: 1,
    failed: 0,
    total: 1,
    stdout: 'out',
    stderr: '',
    workflowUrl: 'http://wf',
    commitUrl: 'http://commit',
  },
  submittedAt: '2024-01-01T00:00:00Z',
});

export function resetCandidateSubmissionsMocks() {
  jest.clearAllMocks();
  useParamsMock.mockReturnValue({ id: 'trial-1', candidateSessionId: '123' });
  listTrialCandidatesMock.mockResolvedValue([
    {
      candidateSessionId: 123,
      status: 'IN_PROGRESS',
      inviteEmail: 'cand@test.com',
    },
  ]);
  talentPartnerGetMock.mockImplementation((path: string) => {
    if (path.startsWith('/submissions?')) {
      return Promise.resolve({
        items: [
          {
            submissionId: 1,
            candidateSessionId: 123,
            taskId: 11,
            dayIndex: 2,
            type: 'code',
            submittedAt: '2024-01-01T00:00:00Z',
          },
          {
            submissionId: 2,
            candidateSessionId: 123,
            taskId: 12,
            dayIndex: 3,
            type: 'code',
            submittedAt: '2024-01-02T00:00:00Z',
          },
        ],
      });
    }
    if (path.startsWith('/submissions/1'))
      return Promise.resolve(buildArtifact(1, 2));
    if (path.startsWith('/submissions/2'))
      return Promise.resolve(buildArtifact(2, 3));
    return Promise.resolve({});
  });
}
