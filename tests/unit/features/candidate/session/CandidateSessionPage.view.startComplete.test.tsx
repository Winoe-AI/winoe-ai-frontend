import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { BRAND_SLUG } from '@/platform/config/brand';
import {
  CandidateSessionPage,
  baseState,
  buildState,
  getCurrentTaskMock,
  primeViewApiMocks,
  routerMock,
  useCandidateSessionMock,
} from './CandidateSessionPage.view.testlib';

describe('CandidateSessionPage view - completion and start state', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    primeViewApiMocks();
    routerMock.push.mockReset();
    routerMock.replace.mockReset();
  });

  it('shows completion message when tasks are complete', async () => {
    const state = baseState();
    window.localStorage.setItem(
      `${BRAND_SLUG}:candidate:recordedSubmissionLatest:99`,
      JSON.stringify({
        submissionId: 5,
        submittedAt: '2026-05-01T21:46:43Z',
      }),
    );
    useCandidateSessionMock.mockReturnValue(
      buildState({
        state: {
          ...state.state,
          bootstrap: {
            ...state.state.bootstrap,
            trial: {
              ...state.state.bootstrap.trial,
              title: 'Infra Trial',
              company: 'Winoe',
            },
            completedAt: '2026-05-01T21:46:43Z',
          },
          taskState: {
            ...state.state.taskState,
            isComplete: true,
            completedAt: '2026-05-05T13:00:00Z',
          },
        },
      }),
    );
    render(<CandidateSessionPage token="inv" />);
    await waitFor(() =>
      expect(
        screen.getByText(/congratulations, your 5-day trial is complete/i),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText(/trial complete/i)).toBeInTheDocument();
    expect(screen.getByText('Infra Trial')).toBeInTheDocument();
    expect(screen.getByText('Winoe')).toBeInTheDocument();
    expect(screen.getByText(/completion date/i)).toBeInTheDocument();
    expect(screen.getByText('May 5, 2026')).toBeInTheDocument();
    expect(screen.getByText(/day 1: design doc/i)).toBeInTheDocument();
  });

  it('navigates to read-only review from the completion screen', async () => {
    const state = baseState();
    useCandidateSessionMock.mockReturnValue(
      buildState({
        state: {
          ...state.state,
          taskState: { ...state.state.taskState, isComplete: true },
        },
      }),
    );
    render(<CandidateSessionPage token="inv" />);
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Review submissions/i }),
      ).toBeInTheDocument(),
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Review submissions/i }),
    );
    expect(routerMock.push).toHaveBeenCalledWith(
      '/candidate/session/inv/review',
    );
  });

  it('renders start view and triggers start fetch when not started', async () => {
    const state = baseState();
    useCandidateSessionMock.mockReturnValue(
      buildState({
        state: {
          ...state.state,
          bootstrap: { ...state.state.bootstrap, status: 'not_started' },
          started: false,
          taskState: {
            loading: false,
            error: null,
            isComplete: false,
            completedTaskIds: [],
            currentTask: null,
          },
        },
      }),
    );
    await act(async () => render(<CandidateSessionPage token="inv" />));
    fireEvent.click(screen.getByRole('button', { name: /Start trial/i }));
    await waitFor(() => expect(getCurrentTaskMock).toHaveBeenCalled());
  });

  it('resumes running state from an in-progress bootstrap after reload', async () => {
    const state = baseState();
    useCandidateSessionMock.mockReturnValue(
      buildState({
        state: {
          ...state.state,
          started: false,
          taskState: {
            loading: false,
            error: null,
            isComplete: false,
            completedTaskIds: [],
            currentTask: null,
          },
        },
      }),
    );
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() => expect(getCurrentTaskMock).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: /Start trial/i })).toBeNull();
  });

  it('navigates to candidate dashboard from start view back button', async () => {
    const state = baseState();
    useCandidateSessionMock.mockReturnValue(
      buildState({
        state: {
          ...state.state,
          bootstrap: { ...state.state.bootstrap, status: 'not_started' },
          started: false,
          taskState: {
            loading: false,
            error: null,
            isComplete: false,
            completedTaskIds: [],
            currentTask: null,
          },
        },
      }),
    );
    await act(async () => render(<CandidateSessionPage token="inv" />));
    fireEvent.click(
      screen.getByRole('button', { name: /Back to Candidate Dashboard/i }),
    );
    expect(routerMock.push).toHaveBeenCalledWith('/candidate/dashboard');
  });
});
