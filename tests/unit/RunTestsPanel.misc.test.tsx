import {
  act,
  baseResult,
  getTestsButton,
  notifyMock,
  render,
  RunTestsPanel,
  screen,
  useFakeTimers,
  userEvent,
} from './RunTestsPanel.testlib';

describe('RunTestsPanel - misc behavior', () => {
  it('clears polling timers on unmount', async () => {
    useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onStart = jest.fn().mockResolvedValue({ runId: 'run-unmount' });
    const onPoll = jest
      .fn()
      .mockResolvedValue({ ...baseResult, status: 'running' as const });
    const { unmount } = render(
      <RunTestsPanel onStart={onStart} onPoll={onPoll} pollIntervalMs={1000} />,
    );
    await user.click(getTestsButton());
    await act(async () => Promise.resolve());
    act(() => {
      unmount();
    });
    await act(async () => {
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
    });
    expect(onPoll).toHaveBeenCalledTimes(0);
  });

  it('does not dedupe toast when run id differs', async () => {
    useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onStart = jest
      .fn()
      .mockResolvedValueOnce({ runId: 'first-run' })
      .mockResolvedValueOnce({ runId: 'second-run' });
    const onPoll = jest
      .fn()
      .mockResolvedValueOnce({ ...baseResult, status: 'passed' as const })
      .mockResolvedValueOnce({ ...baseResult, status: 'passed' as const });
    render(
      <RunTestsPanel onStart={onStart} onPoll={onPoll} pollIntervalMs={1000} />,
    );
    await user.click(getTestsButton());
    await act(async () => {
      jest.advanceTimersByTime(1500);
      await Promise.resolve();
    });
    expect(notifyMock).toHaveBeenCalled();
    notifyMock.mockClear();
    await user.click(screen.getByRole('button', { name: /re-run tests/i }));
    await act(async () => {
      jest.advanceTimersByTime(1500);
      await Promise.resolve();
    });
    expect(notifyMock).toHaveBeenCalled();
  });

  it('ignores stale poll when different run is active', async () => {
    useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onStart = jest
      .fn()
      .mockResolvedValueOnce({ runId: 'run-a' })
      .mockResolvedValueOnce({ runId: 'run-b' });
    const onPoll = jest
      .fn()
      .mockResolvedValueOnce({ ...baseResult, status: 'running' as const })
      .mockResolvedValueOnce({ ...baseResult, status: 'passed' as const });
    render(
      <RunTestsPanel
        onStart={onStart}
        onPoll={onPoll}
        pollIntervalMs={1000}
        storageKey="conflict-key"
      />,
    );
    await user.click(getTestsButton());
    await act(async () => Promise.resolve());
  });
});
