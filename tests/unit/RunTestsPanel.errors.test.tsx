import { act, baseResult, getTestsButton, render, RunTestsPanel, screen, useFakeTimers, userEvent } from './RunTestsPanel.testlib';

describe('RunTestsPanel - error handling', () => {
  it('surfaces errors from start and poll failures', async () => {
    useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onStart = jest.fn().mockRejectedValue(new Error('fail to start'));
    const onPoll = jest.fn().mockRejectedValue(new Error('poll failed'));
    const { rerender } = render(<RunTestsPanel onStart={onStart} onPoll={onPoll} pollIntervalMs={1000} />);
    await user.click(getTestsButton());
    await act(async () => Promise.resolve());
    expect(await screen.findByText(/fail to start/i)).toBeInTheDocument();

    const nextStart = jest.fn().mockResolvedValue({ runId: 'r-err' });
    rerender(<RunTestsPanel onStart={nextStart} onPoll={onPoll} pollIntervalMs={1000} />);
    await user.click(getTestsButton());
    await act(async () => Promise.resolve());
    await act(async () => { jest.advanceTimersByTime(1000); await Promise.resolve(); });
    expect(nextStart).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/poll failed/i)).toBeInTheDocument();
  });

  it('clears start errors after a successful run start', async () => {
    useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onStart = jest.fn().mockRejectedValueOnce(new Error('fail to start')).mockResolvedValueOnce({ runId: 'r-ok' });
    const onPoll = jest.fn().mockResolvedValue({ ...baseResult, status: 'running' as const });
    render(<RunTestsPanel onStart={onStart} onPoll={onPoll} pollIntervalMs={1000} />);
    await user.click(getTestsButton());
    await act(async () => Promise.resolve());
    expect(await screen.findByText(/fail to start/i)).toBeInTheDocument();
    await user.click(getTestsButton());
    expect(onStart).toHaveBeenCalledTimes(2);
    expect(await screen.findByText(/Tests are running/i)).toBeInTheDocument();
    expect(screen.queryByText(/fail to start/i)).not.toBeInTheDocument();
  });

  it('surfaces poll exceptions via normalizeApiError', async () => {
    useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onStart = jest.fn().mockResolvedValue({ runId: 'poll-ex' });
    const onPoll = jest.fn().mockRejectedValue(new Error('poll boom'));
    render(<RunTestsPanel onStart={onStart} onPoll={onPoll} pollIntervalMs={1000} />);
    await user.click(getTestsButton());
    await act(async () => { jest.advanceTimersByTime(1200); await Promise.resolve(); });
    expect(await screen.findByText(/poll boom/i)).toBeInTheDocument();
  });
});
