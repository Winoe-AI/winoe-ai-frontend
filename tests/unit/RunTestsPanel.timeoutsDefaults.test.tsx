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

describe('RunTestsPanel - timeouts and defaults', () => {
  it('times out after max polling attempts when runs never finish', async () => {
    useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onStart = jest.fn().mockResolvedValue({ runId: 'stuck' });
    const onPoll = jest
      .fn()
      .mockResolvedValue({ ...baseResult, status: 'running' as const });
    render(
      <RunTestsPanel
        onStart={onStart}
        onPoll={onPoll}
        pollIntervalMs={1000}
        maxAttempts={2}
      />,
    );
    await user.click(getTestsButton());
    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });
    await act(async () => {
      jest.advanceTimersByTime(1600);
      await Promise.resolve();
    });
    expect(onPoll).toHaveBeenCalledTimes(2);
    await act(async () => {
      jest.advanceTimersByTime(2600);
      await Promise.resolve();
    });
    expect(
      await screen.findByText(/Still running\. Open the workflow link/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Tests timed out/i)).not.toBeInTheDocument();
  });

  it('uses default messages for passed, timeout, and error statuses', async () => {
    useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onStart = jest.fn().mockResolvedValue({ runId: 'run-defaults' });
    const onPoll = jest
      .fn()
      .mockResolvedValueOnce({ ...baseResult, status: 'passed' as const })
      .mockResolvedValueOnce({ ...baseResult, status: 'timeout' as const })
      .mockResolvedValueOnce({ ...baseResult, status: 'error' as const });
    render(
      <RunTestsPanel
        onStart={onStart}
        onPoll={onPoll}
        pollIntervalMs={1000}
        maxAttempts={3}
      />,
    );
    await user.click(getTestsButton());
    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });
    expect(
      await screen.findByText(/Tests passed\. You can submit your work\./i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /re-run tests/i }));
    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });
    expect(await screen.findByText(/Tests timed out/i)).toBeInTheDocument();
    await user.click(getTestsButton());
    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });
    expect(
      await screen.findByText(/Unable to run tests right now/i),
    ).toBeInTheDocument();
  });

  it('honors maxDurationMs and ends run with error when exceeded', async () => {
    useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onStart = jest.fn().mockResolvedValue({ runId: 'duration' });
    const onPoll = jest
      .fn()
      .mockResolvedValue({ ...baseResult, status: 'running' as const });
    render(
      <RunTestsPanel
        onStart={onStart}
        onPoll={onPoll}
        pollIntervalMs={1000}
        maxDurationMs={1}
      />,
    );
    await user.click(getTestsButton());
    await act(async () => {
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
    });
    expect(
      await screen.findByText(/This is taking longer than expected/i),
    ).toBeInTheDocument();
  });

  it('handles missing runId from onStart', async () => {
    useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onStart = jest.fn().mockResolvedValue({});
    const onPoll = jest.fn();
    render(
      <RunTestsPanel onStart={onStart} onPoll={onPoll} pollIntervalMs={1000} />,
    );
    await user.click(getTestsButton());
    await act(async () => Promise.resolve());
    expect(await screen.findByText(/Missing run id/i)).toBeInTheDocument();
    expect(onPoll).not.toHaveBeenCalled();
  });
});
