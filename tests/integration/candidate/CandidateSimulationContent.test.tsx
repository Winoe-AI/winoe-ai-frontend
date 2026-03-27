import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CandidateSessionPage from '@/features/candidate/session/CandidateSessionPage';
import { CandidateSessionProvider } from '@/features/candidate/session/CandidateSessionProvider';
import { getCandidateCurrentTask, resolveCandidateInviteToken } from '@/features/candidate/api';

jest.mock('@/features/candidate/api', () => {
  const actual = jest.requireActual('@/features/candidate/api');
  return { __esModule: true, ...actual, getCandidateCurrentTask: jest.fn(), resolveCandidateInviteToken: jest.fn() };
});

const routerMock = { push: jest.fn(), refresh: jest.fn(), replace: jest.fn(), prefetch: jest.fn(), back: jest.fn(), forward: jest.fn() };
jest.mock('next/navigation', () => ({ useRouter: () => routerMock }));

const currentTaskMock = getCandidateCurrentTask as unknown as jest.Mock;
const resolveMock = resolveCandidateInviteToken as unknown as jest.Mock;
const renderWithProvider = (ui: React.ReactNode) => render(<CandidateSessionProvider>{ui}</CandidateSessionProvider>);
const realFetch = global.fetch;
const fetchMock = jest.fn();

describe('CandidateSessionPage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    Object.values(routerMock).forEach((fn) => fn.mockReset());
    sessionStorage.clear();
    localStorage.clear();
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    resolveMock.mockResolvedValue({ candidateSessionId: 123, status: 'in_progress', simulation: { title: 'Sim', role: 'Backend' } });
  });

  afterAll(() => {
    global.fetch = realFetch;
  });

  it('resolves invite and starts current task', async () => {
    resolveMock.mockResolvedValueOnce({ candidateSessionId: 123, status: 'in_progress', simulation: { title: 'Backend Engineer Simulation', role: 'Backend' } });
    currentTaskMock.mockResolvedValue({
      isComplete: false,
      completedTaskIds: [],
      currentTask: { id: 1, dayIndex: 1, type: 'design', title: 'Day 1 — Architecture', description: 'Plan it' },
    });

    renderWithProvider(<CandidateSessionPage token="VALID_TOKEN" />);

    expect(await screen.findByText('Backend Engineer Simulation')).toBeInTheDocument();
    expect(await screen.findByText('How code tasks work')).toBeInTheDocument();
    expect(screen.getByText(/Do not paste tokens or secrets/i)).toBeInTheDocument();
    expect(screen.getByText(/Use the repo link provided/i)).toBeInTheDocument();
    await waitFor(() => expect(resolveMock).toHaveBeenCalledTimes(1));

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /Start simulation/i }));
    expect(await screen.findByText(/Role:\s*Backend/i)).toBeInTheDocument();
    expect((await screen.findAllByText('Day 1 — Architecture')).length).toBeGreaterThan(0);
    expect(currentTaskMock).toHaveBeenCalledWith(123);
  });

  it('redirects to login and hides auth card when invite bootstrap returns 401', async () => {
    resolveMock.mockRejectedValueOnce({ status: 401 });
    renderWithProvider(<CandidateSessionPage token="VALID_TOKEN" />);
    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith(expect.stringContaining('/auth/login?')));
    expect(screen.queryByText(/sign in to continue/i)).not.toBeInTheDocument();
  });
});
