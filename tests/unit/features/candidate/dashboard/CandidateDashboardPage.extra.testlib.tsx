import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import CandidateDashboardPage, {
  extractInviteToken,
} from '@/features/candidate/dashboard/CandidateDashboardPage';

export const listCandidateInvitesMock = jest.fn();
const useRouterMock = { push: jest.fn(), replace: jest.fn() };
const useCandidateSessionMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => useRouterMock,
}));

jest.mock('@/features/candidate/api', () => ({
  listCandidateInvites: (input?: unknown) => listCandidateInvitesMock(input),
}));

jest.mock('@/features/candidate/session/CandidateSessionProvider', () => ({
  useCandidateSession: () => useCandidateSessionMock(),
}));

export const setupDashboardExtraTest = () => {
  jest.clearAllMocks();
  useRouterMock.push.mockClear();
  useRouterMock.replace.mockClear();
  useCandidateSessionMock.mockReturnValue({
    state: {
      token: 'access-token',
      authStatus: 'authenticated',
      candidateSessionId: null,
      inviteToken: null,
    },
    loadAccessToken: jest.fn(),
  });
  return jest.spyOn(console, 'error').mockImplementation(() => {});
};

type Invite = {
  candidateSessionId: number;
  title: string;
  role: string;
  status: string;
  isExpired: boolean;
  token: string;
  company?: string | null;
  progress?: { completed: number; total: number } | null;
  lastActivityAt?: string | null;
  expiresAt?: string | null;
};

export const makeInvite = (overrides: Partial<Invite> = {}): Invite => ({
  candidateSessionId: 1,
  title: 'Sample Sim',
  role: 'Developer',
  status: 'in_progress',
  isExpired: false,
  token: 'tok-1',
  ...overrides,
});

export const renderDashboardInvite = async (invite: Invite) => {
  listCandidateInvitesMock.mockResolvedValue([invite]);
  await act(async () => {
    render(<CandidateDashboardPage />);
  });
  await waitFor(() => {
    expect(screen.getByText(invite.title)).toBeInTheDocument();
  });
};

export { extractInviteToken };
