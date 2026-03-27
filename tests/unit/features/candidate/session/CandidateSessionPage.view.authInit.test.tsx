import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import {
  CandidateSessionPage,
  baseState,
  buildState,
  buildLoginHrefMock,
  getCurrentTaskMock,
  primeViewApiMocks,
  resolveInviteMock,
  routerMock,
  useCandidateSessionMock,
} from './CandidateSessionPage.view.testlib';

describe('CandidateSessionPage view - auth and init guards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    primeViewApiMocks();
    routerMock.push.mockReset();
    routerMock.replace.mockReset();
  });

  it('redirects unauthenticated users to login', async () => {
    resolveInviteMock.mockRejectedValue({ status: 401 });
    const state = baseState();
    useCandidateSessionMock.mockReturnValue(
      buildState({ state: { ...state.state, authStatus: 'ready' } }),
    );
    render(<CandidateSessionPage token="inv" />);
    await waitFor(() => expect(buildLoginHrefMock).toHaveBeenCalled());
    await waitFor(() => expect(routerMock.replace).toHaveBeenCalled());
  });

  it('does not re-run init when same token and already in flight', async () => {
    useCandidateSessionMock.mockReturnValue(buildState());
    resolveInviteMock.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );
    await act(async () => render(<CandidateSessionPage token="inv" />));
    expect(resolveInviteMock).toHaveBeenCalledTimes(1);
  });

  it('renders task error banner with retry', async () => {
    const state = baseState();
    getCurrentTaskMock.mockResolvedValue({
      isComplete: false,
      completedTaskIds: [],
      currentTask: {
        id: 1,
        dayIndex: 2,
        type: 'code',
        title: 'Code Day',
        description: 'http://docs',
      },
    });
    useCandidateSessionMock.mockReturnValue(
      buildState({
        state: {
          ...state.state,
          started: true,
          taskState: {
            loading: false,
            error: 'Task fetch failed',
            isComplete: false,
            completedTaskIds: [],
            currentTask: {
              id: 1,
              dayIndex: 2,
              type: 'code',
              title: 'Code Day',
              description: '',
            },
          },
        },
      }),
    );
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() =>
      expect(screen.getByText('Task fetch failed')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));
    await waitFor(() =>
      expect(getCurrentTaskMock).toHaveBeenCalledWith(
        99,
        expect.objectContaining({ skipCache: true }),
      ),
    );
  });
});
