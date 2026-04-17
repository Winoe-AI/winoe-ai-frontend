import React from 'react';
import { act, render } from '@testing-library/react';

export const listTrialCandidatesMock = jest.fn();
export const listTrialsMock = jest.fn();
export const talentPartnerGetMock = jest.fn();
export const useParamsMock = jest.fn(() => ({ id: 'trial-1' }));
export const notifyMock = jest.fn();
export const updateMock = jest.fn();
export const inviteFlowResetMock = jest.fn();
export const inviteFlowSubmitMock = jest.fn();

jest.mock('next/navigation', () => ({ useParams: () => useParamsMock() }));
jest.mock('@/features/talent-partner/api', () => ({
  listTrialCandidates: (...args: unknown[]) => listTrialCandidatesMock(...args),
  listTrials: (...args: unknown[]) => listTrialsMock(...args),
  normalizeCandidateSession: (data: unknown) => data,
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
jest.mock('@/features/talent-partner/utils/formattersUtils', () => {
  const actual = jest.requireActual(
    '@/features/talent-partner/utils/formattersUtils',
  );
  return { ...actual, copyInviteLink: jest.fn() };
});
jest.mock('@/shared/notifications', () => ({
  useNotifications: () => ({ notify: notifyMock, update: updateMock }),
}));
jest.mock(
  '@/features/talent-partner/dashboard/hooks/useInviteCandidateFlow',
  () => ({
    useInviteCandidateFlow: () => ({
      state: { status: 'idle' },
      submit: inviteFlowSubmitMock,
      reset: inviteFlowResetMock,
    }),
  }),
);
jest.mock(
  '@/features/talent-partner/trial-management/invitations/InviteCandidateModal',
  () => ({
    InviteCandidateModal: (props: { open: boolean }) =>
      props.open ? <div data-testid="invite-modal">Modal</div> : null,
  }),
);

export const TalentPartnerTrialDetailPage = (
  jest.requireActual(
    '@/features/talent-partner/trial-management/detail/TalentPartnerTrialDetailPage',
  ) as {
    default: () => React.JSX.Element;
  }
).default;

export const copyInviteLinkMock = (
  jest.requireMock('@/features/talent-partner/utils/formattersUtils') as {
    copyInviteLink: jest.Mock;
  }
).copyInviteLink;

export const primeDetailMocks = () => {
  jest.clearAllMocks();
  useParamsMock.mockReturnValue({ id: 'trial-1' });
  listTrialsMock.mockResolvedValue([
    {
      id: 'trial-1',
      title: 'Test Trial',
      templateKey: 'template-1',
      candidateCount: 0,
    },
  ]);
  listTrialCandidatesMock.mockResolvedValue([]);
  talentPartnerGetMock.mockResolvedValue({
    status: 'active_inviting',
    title: 'Test Trial',
    templateKey: 'template-1',
    role: 'Developer',
    techStack: 'React',
    focus: 'Testing',
    scenario: 'Build an app',
    tasks: [
      { dayIndex: 1, title: 'Day 1', type: 'text', prompt: 'Task 1' },
      {
        dayIndex: 2,
        title: 'Day 2',
        type: 'code',
        prompt: 'Task 2',
        repoProvisioned: true,
      },
      {
        dayIndex: 3,
        title: 'Day 3',
        type: 'code',
        prompt: 'Task 3',
        repoUrl: 'http://repo',
        repoName: 'test/repo',
      },
    ],
  });
};

export const renderDetailPage = async () => {
  await act(async () => {
    render(<TalentPartnerTrialDetailPage />);
  });
};
