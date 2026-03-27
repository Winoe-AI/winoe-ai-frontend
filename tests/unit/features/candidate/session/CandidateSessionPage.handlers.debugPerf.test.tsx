import { act, render, screen, waitFor } from '@testing-library/react';
import {
  CandidateSessionPage,
  baseState,
  primeHandlerApiMocks,
  useCandidateSessionMock,
} from './CandidateSessionPage.handlers.testlib';

describe('CandidateSessionPage debug/perf paths', () => {
  let consoleDebugSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();
    primeHandlerApiMocks();
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_TENON_DEBUG_PERF;
  });

  afterAll(() => {
    consoleDebugSpy.mockRestore();
    consoleInfoSpy.mockRestore();
  });

  it('does not log debug output when TENON_DEBUG_PERF is not set', async () => {
    useCandidateSessionMock.mockReturnValue(baseState());
    await act(async () => render(<CandidateSessionPage token="inv" />));
    await waitFor(() => expect(screen.getByTestId('run-tests-panel')).toBeInTheDocument());
    expect(consoleDebugSpy).not.toHaveBeenCalledWith(expect.stringContaining('[candidate-session]'));
  });
});
