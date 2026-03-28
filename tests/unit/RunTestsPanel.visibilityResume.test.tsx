import {
  act,
  baseResult,
  getTestsButton,
  render,
  RunTestsPanel,
  screen,
  useFakeTimers,
  userEvent,
} from './RunTestsPanel.testlib';

describe('RunTestsPanel - visibility and resume behavior', () => {
  it('restores in-flight run from sessionStorage when present', async () => {
    useFakeTimers();
    sessionStorage.setItem('stored-run', 'run-resume');
    const onPoll = jest
      .fn()
      .mockResolvedValueOnce({ ...baseResult, status: 'running' as const })
      .mockResolvedValueOnce({ ...baseResult, status: 'passed' as const });
    render(
      <RunTestsPanel
        onStart={jest.fn()}
        onPoll={onPoll}
        storageKey="stored-run"
        pollIntervalMs={100}
      />,
    );
    await act(async () => {
      jest.advanceTimersByTime(1200);
      await Promise.resolve();
      jest.advanceTimersByTime(1200);
      await Promise.resolve();
    });
    expect(
      screen.getByText(/Tests are running\. This can take a minute\./i),
    ).toBeInTheDocument();
  });

  it('resumes pending poll when tab becomes visible', async () => {
    useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
    });
    const onStart = jest.fn().mockResolvedValue({ runId: 'pending-1' });
    const onPoll = jest
      .fn()
      .mockResolvedValueOnce({ ...baseResult, status: 'running' as const })
      .mockResolvedValueOnce({ ...baseResult, status: 'passed' as const });
    render(
      <RunTestsPanel
        onStart={onStart}
        onPoll={onPoll}
        pollIntervalMs={50}
        maxPollIntervalMs={50}
      />,
    );
    await user.click(screen.getByRole('button'));
    expect(onPoll).not.toHaveBeenCalled();
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await act(async () => {
      jest.advanceTimersByTime(1100);
      await Promise.resolve();
    });
    expect(onPoll).toHaveBeenCalledWith('pending-1');
  });

  it('queues poll when visibility hidden during running poll', async () => {
    useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onStart = jest.fn().mockResolvedValue({ runId: 'hidden-poll' });
    const onPoll = jest
      .fn()
      .mockResolvedValueOnce({ ...baseResult, status: 'running' as const })
      .mockResolvedValueOnce({ ...baseResult, status: 'passed' as const });
    render(
      <RunTestsPanel
        onStart={onStart}
        onPoll={onPoll}
        pollIntervalMs={1000}
        maxPollIntervalMs={1000}
      />,
    );
    await user.click(getTestsButton());
    await act(async () => {
      jest.advanceTimersByTime(1100);
      await Promise.resolve();
    });
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
    });
    await act(async () => {
      jest.advanceTimersByTime(1500);
      await Promise.resolve();
    });
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await act(async () => {
      jest.advanceTimersByTime(1500);
      await Promise.resolve();
    });
    expect(screen.getByText(/Tests passed/i)).toBeInTheDocument();
  });
});
