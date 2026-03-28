import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CandidateDashboardPage from '@/features/candidate/portal/CandidateDashboardPage';
import { useCandidateSession } from '@/features/candidate/session/CandidateSessionProvider';
import { listCandidateInvites } from '@/features/candidate/session/api';
import {
  fallbackInvite,
  sortedInvites,
} from './CandidateDashboardPage.unit.fixtures';

jest.mock('@/features/candidate/session/CandidateSessionProvider', () => ({
  useCandidateSession: jest.fn(),
}));

jest.mock('@/features/candidate/session/api', () => ({
  listCandidateInvites: jest.fn(),
}));

const routerMock = {
  push: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => routerMock,
}));

const mockUseCandidateSession = useCandidateSession as jest.Mock;
const listInvitesMock = listCandidateInvites as jest.Mock;

const buildSession = (overrides?: {
  token?: string | null;
  authStatus?: 'idle' | 'loading' | 'ready' | 'unauthenticated' | 'error';
  inviteToken?: string | null;
  candidateSessionId?: number | null;
}) => ({
  state: {
    inviteToken: overrides?.inviteToken ?? 'fallback-token',
    token: overrides?.token ?? 'auth-token',
    candidateSessionId: overrides?.candidateSessionId ?? 1,
    bootstrap: null,
    started: false,
    taskState: {
      loading: false,
      error: null,
      isComplete: false,
      completedTaskIds: [],
      currentTask: null,
    },
    authStatus: overrides?.authStatus ?? 'ready',
    authError: null,
  },
  loadAccessToken: jest.fn(),
});

describe('CandidateDashboardPage unit flow', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockUseCandidateSession.mockReturnValue(buildSession());
  });

  it('surfaces invite load errors', async () => {
    listInvitesMock.mockRejectedValueOnce(new Error('load fail'));

    render(<CandidateDashboardPage signedInEmail="c@example.com" />);

    await waitFor(() =>
      expect(screen.getByText('load fail')).toBeInTheDocument(),
    );
  });

  it('sorts invites by last activity or expiry', async () => {
    listInvitesMock.mockResolvedValueOnce(sortedInvites);

    render(<CandidateDashboardPage signedInEmail="c@example.com" />);

    const newer = await screen.findByText('Newer');
    const older = await screen.findByText('Older');
    expect(
      newer.compareDocumentPosition(older) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('uses fallback token when invite is missing token', async () => {
    listInvitesMock.mockResolvedValueOnce([fallbackInvite]);

    render(<CandidateDashboardPage signedInEmail="c@example.com" />);

    const button = await screen.findByRole('button', {
      name: /Start simulation/i,
    });
    fireEvent.click(button);
    expect(routerMock.push).toHaveBeenCalledWith(
      '/candidate/session/fallback-token',
    );
  });
});
