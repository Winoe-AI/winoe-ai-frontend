import React from 'react';
import CandidateSubmissionsPage, {
  ArtifactCard,
} from '@/features/talent-partner/submission-review/CandidateSubmissionsPage';

export const listTrialCandidatesMock = jest.fn();
export const talentPartnerGetMock = jest.fn();
const useParamsMock = jest.fn(() => ({
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
jest.mock('next/dynamic', () => {
  return (
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
  };
});

type Artifact = React.ComponentProps<typeof ArtifactCard>['artifact'];
export const buildArtifact = (
  id: number,
  dayIndex: number,
  overrides?: Partial<Artifact>,
): Artifact =>
  ({
    submissionId: id,
    candidateSessionId: 123,
    task: {
      taskId: 10 + id,
      dayIndex,
      type: 'code',
      title: `Task ${id}`,
      prompt: null,
    },
    contentText: null,
    repoUrl: null,
    repoFullName: null,
    workflowUrl: null,
    commitUrl: null,
    diffUrl: null,
    diffSummary: null,
    testResults: null,
    submittedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  }) as Artifact;

export const resetCandidateSubmissionsExtraMocks = () => {
  jest.clearAllMocks();
  useParamsMock.mockReturnValue({ id: 'trial-1', candidateSessionId: '123' });
  listTrialCandidatesMock.mockResolvedValue([
    {
      candidateSessionId: 123,
      candidateName: 'Test User',
      status: 'COMPLETED',
      inviteEmail: 'cand@test.com',
      startedAt: '2024-01-01T00:00:00Z',
      completedAt: '2024-01-05T00:00:00Z',
    },
  ]);
};

export { CandidateSubmissionsPage, ArtifactCard };
