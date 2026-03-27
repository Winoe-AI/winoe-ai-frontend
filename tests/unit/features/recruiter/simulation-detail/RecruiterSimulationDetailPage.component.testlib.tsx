import React from 'react';
import { act, render } from '@testing-library/react';

export const listSimulationCandidatesMock = jest.fn();
export const listSimulationsMock = jest.fn();
export const recruiterGetMock = jest.fn();
export const useParamsMock = jest.fn(() => ({ id: 'sim-1' }));
export const notifyMock = jest.fn();
export const updateMock = jest.fn();
export const inviteFlowResetMock = jest.fn();
export const inviteFlowSubmitMock = jest.fn();

jest.mock('next/navigation', () => ({ useParams: () => useParamsMock() }));
jest.mock('@/features/recruiter/api', () => ({
  listSimulationCandidates: (...args: unknown[]) => listSimulationCandidatesMock(...args),
  listSimulations: (...args: unknown[]) => listSimulationsMock(...args),
  normalizeCandidateSession: (data: unknown) => data,
}));
jest.mock('@/lib/api/client', () => {
  const actual = jest.requireActual('@/lib/api/client');
  return { ...actual, recruiterBffClient: { get: (...args: unknown[]) => recruiterGetMock(...args) } };
});
jest.mock('@/features/recruiter/utils/formatters', () => {
  const actual = jest.requireActual('@/features/recruiter/utils/formatters');
  return { ...actual, copyInviteLink: jest.fn() };
});
jest.mock('@/shared/notifications', () => ({ useNotifications: () => ({ notify: notifyMock, update: updateMock }) }));
jest.mock('@/features/recruiter/dashboard/hooks/useInviteCandidateFlow', () => ({
  useInviteCandidateFlow: () => ({ state: { status: 'idle' }, submit: inviteFlowSubmitMock, reset: inviteFlowResetMock }),
}));
jest.mock('@/features/recruiter/invitations/InviteCandidateModal', () => ({
  InviteCandidateModal: (props: { open: boolean }) => (props.open ? <div data-testid="invite-modal">Modal</div> : null),
}));

export const RecruiterSimulationDetailPage = (
  jest.requireActual('@/features/recruiter/simulations/detail/RecruiterSimulationDetailPage') as {
    default: () => React.JSX.Element;
  }
).default;

export const copyInviteLinkMock = (
  jest.requireMock('@/features/recruiter/utils/formatters') as { copyInviteLink: jest.Mock }
).copyInviteLink;

export const primeDetailMocks = () => {
  jest.clearAllMocks();
  useParamsMock.mockReturnValue({ id: 'sim-1' });
  listSimulationsMock.mockResolvedValue([{ id: 'sim-1', title: 'Test Simulation', templateKey: 'template-1' }]);
  listSimulationCandidatesMock.mockResolvedValue([]);
  recruiterGetMock.mockResolvedValue({
    status: 'active_inviting',
    title: 'Test Simulation',
    templateKey: 'template-1',
    role: 'Developer',
    techStack: 'React',
    focus: 'Testing',
    scenario: 'Build an app',
    tasks: [
      { dayIndex: 1, title: 'Day 1', type: 'text', prompt: 'Task 1' },
      { dayIndex: 2, title: 'Day 2', type: 'code', prompt: 'Task 2', repoProvisioned: true },
      { dayIndex: 3, title: 'Day 3', type: 'code', prompt: 'Task 3', repoUrl: 'http://repo', repoName: 'test/repo' },
    ],
  });
};

export const renderDetailPage = async () => {
  await act(async () => {
    render(<RecruiterSimulationDetailPage />);
  });
};
