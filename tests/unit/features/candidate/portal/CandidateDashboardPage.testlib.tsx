import React from 'react';
import { act, render } from '@testing-library/react';
import CandidateDashboardPage from '@/features/candidate/portal/CandidateDashboardPage';

export const listCandidateInvitesMock = jest.fn();
export const getCandidateCompletedReviewMock = jest.fn();
export const useRouterMock = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
};
export const useCandidateSessionMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => useRouterMock,
}));

jest.mock('@/features/candidate/session/api', () => ({
  listCandidateInvites: (...args: unknown[]) =>
    listCandidateInvitesMock(...args),
  getCandidateCompletedReview: (...args: unknown[]) =>
    getCandidateCompletedReviewMock(...args),
  resolveCandidateInviteToken: jest.fn(),
  getCandidateCurrentTask: jest.fn(),
}));

jest.mock('@/features/candidate/session/CandidateSessionProvider', () => ({
  useCandidateSession: () => useCandidateSessionMock(),
}));

const defaultSessionState = {
  token: 'access-token',
  authStatus: 'authenticated',
  candidateSessionId: null,
  inviteToken: null,
};

export const resetDashboardPageMocks = () => {
  jest.clearAllMocks();
  useRouterMock.push.mockClear();
  useRouterMock.replace.mockClear();
  useRouterMock.prefetch.mockClear();
  useCandidateSessionMock.mockReturnValue({
    state: defaultSessionState,
    loadAccessToken: jest.fn(),
  });
  return jest.spyOn(console, 'error').mockImplementation(() => {});
};

export const setCandidateSessionState = (
  state: Partial<typeof defaultSessionState>,
) => {
  useCandidateSessionMock.mockReturnValue({
    state: { ...defaultSessionState, ...state },
    loadAccessToken: jest.fn(),
  });
};

export const renderDashboardPage = async (
  props?: React.ComponentProps<typeof CandidateDashboardPage>,
) => {
  await act(async () => {
    render(<CandidateDashboardPage {...props} />);
  });
};
