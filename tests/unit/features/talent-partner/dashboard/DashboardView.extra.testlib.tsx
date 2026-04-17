import React from 'react';
import { act, render, screen } from '@testing-library/react';
import DashboardView from '@/features/talent-partner/dashboard/TalentPartnerDashboardView';
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

jest.mock('next/dynamic', () => {
  return (
    _importer: () => Promise<unknown>,
    opts: { loading?: () => React.ReactElement },
  ) => {
    const Mock = (props: Record<string, unknown>) => {
      captureModalProps(props);
      return (
        <div data-testid="invite-modal">
          <button
            data-testid="close-btn"
            onClick={() => (props.onClose as () => void)?.()}
          >
            Close
          </button>
        </div>
      );
    };
    (Mock as { loading?: () => React.ReactElement }).loading = opts?.loading;
    return Mock;
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
    TrialSection: (props: {
      trials: Array<{
        id: string;
        title: string;
        status: string;
        candidateCount: number;
      }>;
      loading: boolean;
      error: string | null;
      onInvite?: (trial: { id: string; title: string }) => void;
      onRetry?: () => void;
    }) => (
      <div data-testid="trial-section">
        <button onClick={() => props.onInvite?.({ id: '1', title: 'Trial 1' })}>
          invite
        </button>
        <button onClick={() => props.onRetry?.()}>retry</button>
      </div>
    ),
  }),
);

type Trial = {
  id: string;
  title: string;
  role: string;
  createdAt: string;
  candidateCount: number;
};
export const baseProps = () => ({
  profile: { id: 1, name: 'TalentPartner', email: 'r@test.com', role: 'Admin' },
  error: null,
  profileLoading: false,
  trials: [
    {
      id: '1',
      title: 'Trial',
      role: 'Engineer',
      createdAt: '2026-01-01T00:00:00Z',
      candidateCount: 0,
    } as Trial,
  ],
  trialsError: null,
  trialsLoading: false,
  onRefresh: jest.fn(),
});

export const inviteFlowHookMock = useInviteCandidateFlow as jest.Mock;

export function resetDashboardExtraMocks() {
  jest.clearAllMocks();
  inviteFlowSubmitMock.mockResolvedValue({
    inviteUrl: 'http://invite',
    outcome: 'sent',
    trialId: '1',
    candidateName: 'Ann',
    candidateEmail: 'a@test.com',
  });
  copyInviteLinkMock.mockResolvedValue(true);
  inviteFlowHookMock.mockReturnValue({
    state: { status: 'idle' },
    submit: inviteFlowSubmitMock,
    reset: inviteFlowResetMock,
  });
}

export async function renderDashboardExtra() {
  const props = baseProps();
  let view: ReturnType<typeof render> | null = null;
  await act(async () => {
    view = render(<DashboardView {...props} />);
  });
  return { props, view: view! };
}

export function openInviteModal() {
  act(() => {
    screen.getByTestId('trial-section').querySelector('button')?.click();
  });
}

export async function submitInvite(name: string, email: string) {
  const modalProps = captureModalProps.mock.calls[0]?.[0] as {
    onSubmit: (n: string, e: string) => Promise<void>;
  };
  await act(async () => {
    await modalProps.onSubmit(name, email);
  });
}
