import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import CandidateDashboardPage, {
  extractInviteToken,
} from '@/features/candidate/portal/CandidateDashboardPage';

export const listCandidateInvitesMock = jest.fn();
const useRouterMock = { push: jest.fn(), replace: jest.fn() };
const useCandidateSessionMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => useRouterMock,
}));

jest.mock('@/features/candidate/session/api', () => ({
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
  candidateEmail?: string | null;
  inviteEmail?: string | null;
  talentPartnerName?: string | null;
  talentPartnerEmail?: string | null;
  progress?: { completed: number; total: number } | null;
  lastActivityAt?: string | null;
  expiresAt?: string | null;
  scheduledStartAt?: string | null;
  candidateTimezone?: string | null;
  dayWindows?: Array<{
    dayIndex: number;
    windowStartAt: string;
    windowEndAt: string;
  }> | null;
  currentDayWindow?: {
    dayIndex: number;
    windowStartAt: string;
    windowEndAt: string;
    state: 'upcoming' | 'active' | 'closed';
  } | null;
  reportReady?: boolean | null;
  hasReport?: boolean | null;
  completedAt?: string | null;
  terminatedAt?: string | null;
  isTerminated?: boolean;
};

export const makeInvite = (overrides: Partial<Invite> = {}): Invite => ({
  candidateSessionId: 1,
  title: 'Sample Sim',
  role: 'Developer',
  status: 'in_progress',
  isExpired: false,
  token: 'tok-1',
  talentPartnerName: 'Taylor Partner',
  candidateEmail: 'candidate@example.com',
  inviteEmail: 'candidate@example.com',
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
