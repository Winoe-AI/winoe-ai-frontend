import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  CandidateSessionPage,
  baseState,
  pollTestRunMock,
  primeHandlerApiMocks,
  startTestRunMock,
  useCandidateSessionMock,
} from './CandidateSessionPage.handlers.testlib';

describe('CandidateSessionPage handlers - test runs', () => {
  const originalEnv = process.env.NEXT_PUBLIC_TENON_DEBUG_PERF;
  let consoleSpies: ReturnType<typeof jest.spyOn>[];

  beforeAll(() => {
    consoleSpies = [
      jest.spyOn(console, 'error').mockImplementation(() => {}),
      jest.spyOn(console, 'debug').mockImplementation(() => {}),
      jest.spyOn(console, 'info').mockImplementation(() => {}),
    ];
  });

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.NEXT_PUBLIC_TENON_DEBUG_PERF;
    primeHandlerApiMocks();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_TENON_DEBUG_PERF = originalEnv;
  });

  afterAll(() => {
    consoleSpies.forEach((spy) => spy.mockRestore());
  });

  it('calls startCandidateTestRun with correct params when running tests', async () => {
    useCandidateSessionMock.mockReturnValue(baseState());
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() => expect(screen.getByTestId('run-tests-panel')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('run-tests-btn'));
    await waitFor(() => expect(startTestRunMock).toHaveBeenCalledWith({ taskId: 1, candidateSessionId: 99 }));
  });

  it('calls pollCandidateTestRun with correct params', async () => {
    useCandidateSessionMock.mockReturnValue(baseState());
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() => expect(screen.getByTestId('run-tests-panel')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('run-tests-btn'));
    await waitFor(() => expect(pollTestRunMock).toHaveBeenCalledWith({ taskId: 1, runId: 'test-run-id', candidateSessionId: 99 }));
  });
});
