import React from 'react';
import { useInviteCandidateFlow } from '@/features/talent-partner/dashboard/hooks/useInviteCandidateFlow';

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
  '@/features/talent-partner/dashboard/hooks/useInviteCandidateFlow',
  () => ({
    useInviteCandidateFlow: jest.fn(() => ({
      state: { status: 'idle' },
      submit: inviteFlowSubmitMock,
      reset: inviteFlowResetMock,
    })),
  }),
);
jest.mock('@/features/talent-partner/utils/formattersUtils', () => ({
  copyInviteLink: (...args: unknown[]) => copyInviteLinkMock(...args),
}));
jest.mock('next/dynamic', () => () => {
  return function Mock(props: Record<string, unknown>) {
    captureModalProps(props);
    return <div data-testid="invite-modal" />;
  };
});
jest.mock('@/features/talent-partner/dashboard/components/ProfileCard', () => ({
  ProfileCard: ({ name }: { name: string }) => (
    <div data-testid="profile-card">{name}</div>
  ),
}));
jest.mock(
  '@/features/talent-partner/dashboard/components/TrialSection',
  () => ({
    TrialSection: ({
      trials,
      loading,
      error,
      onInvite,
    }: {
      trials: Array<{ id: string; title: string; status: string }>;
      loading: boolean;
      error: string | null;
      onInvite?: (trial: { id: string; title: string }) => void;
    }) => (
      <div data-testid="trial-section">
        <button onClick={() => onInvite?.({ id: '1', title: 'Trial 1' })}>
          invite
        </button>
        {JSON.stringify({ trials, loading, error })}
      </div>
    ),
  }),
);

type Trial = {
  id: string;
  title: string;
  status: string;
  candidateCount: number;
};
export const baseProps = () => ({
  profile: { name: 'TalentPartner', email: 'r@test.com', role: 'Admin' },
  error: null,
  profileLoading: false,
  trials: [
    { id: '1', title: 'Trial', status: 'Draft', candidateCount: 0 } as Trial,
  ],
  trialsError: null,
  trialsLoading: false,
  onRefresh: jest.fn(),
});

export const inviteFlowHookMock = useInviteCandidateFlow as jest.Mock;

export function resetDashboardViewMocks() {
  jest.clearAllMocks();
  inviteFlowSubmitMock.mockResolvedValue({
    inviteUrl: 'http://invite',
    outcome: 'sent',
    trialId: '1',
    candidateName: 'Ann',
    candidateEmail: 'a@test.com',
  });
}
