import React from 'react';
import { useInviteCandidateFlow } from '@/features/recruiter/dashboard/hooks/useInviteCandidateFlow';

export const notifyMock = jest.fn();
export const updateMock = jest.fn();
export const inviteFlowResetMock = jest.fn();
export const inviteFlowSubmitMock = jest.fn();
export const captureModalProps = jest.fn();
export const copyInviteLinkMock = jest.fn();

jest.mock('@/shared/notifications', () => ({
  useNotifications: () => ({ notify: notifyMock, update: updateMock }),
}));
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));
jest.mock(
  '@/features/recruiter/dashboard/hooks/useInviteCandidateFlow',
  () => ({
    useInviteCandidateFlow: jest.fn(() => ({
      state: { status: 'idle' },
      submit: inviteFlowSubmitMock,
      reset: inviteFlowResetMock,
    })),
  }),
);
jest.mock('@/features/recruiter/utils/formattersUtils', () => ({
  copyInviteLink: (...args: unknown[]) => copyInviteLinkMock(...args),
}));
jest.mock('next/dynamic', () => () => {
  return function Mock(props: Record<string, unknown>) {
    captureModalProps(props);
    return <div data-testid="invite-modal" />;
  };
});
jest.mock('@/features/recruiter/dashboard/components/ProfileCard', () => ({
  ProfileCard: ({ name }: { name: string }) => (
    <div data-testid="profile-card">{name}</div>
  ),
}));
jest.mock(
  '@/features/recruiter/dashboard/components/SimulationSection',
  () => ({
    SimulationSection: ({
      simulations,
      loading,
      error,
      onInvite,
    }: {
      simulations: Array<{ id: string; title: string; status: string }>;
      loading: boolean;
      error: string | null;
      onInvite?: (sim: { id: string; title: string }) => void;
    }) => (
      <div data-testid="simulation-section">
        <button onClick={() => onInvite?.({ id: '1', title: 'Sim 1' })}>
          invite
        </button>
        {JSON.stringify({ simulations, loading, error })}
      </div>
    ),
  }),
);

type Simulation = { id: string; title: string; status: string };
export const baseProps = () => ({
  profile: { name: 'Recruiter', email: 'r@test.com', role: 'Admin' },
  error: null,
  profileLoading: false,
  simulations: [{ id: '1', title: 'Sim', status: 'Draft' } as Simulation],
  simulationsError: null,
  simulationsLoading: false,
  onRefresh: jest.fn(),
});

export const inviteFlowHookMock = useInviteCandidateFlow as jest.Mock;

export function resetDashboardViewMocks() {
  jest.clearAllMocks();
  inviteFlowSubmitMock.mockResolvedValue({
    inviteUrl: 'http://invite',
    outcome: 'sent',
    simulationId: '1',
    candidateName: 'Ann',
    candidateEmail: 'a@test.com',
  });
}
