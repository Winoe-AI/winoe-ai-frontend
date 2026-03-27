import { act, baseResult, getTestsButton, render, RunTestsPanel, screen, useFakeTimers, userEvent } from './RunTestsPanel.testlib';

describe('RunTestsPanel - output and clipboard', () => {
  it('truncates stdout and expands/collapses on demand', async () => {
    useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const longStdout = 'a'.repeat(9001);
    const onStart = jest.fn().mockResolvedValue({ runId: 'run-output' });
    const onPoll = jest.fn().mockResolvedValueOnce({ ...baseResult, status: 'failed' as const, stdout: longStdout, stderr: 'err', failed: 1, total: 1 });
    render(<RunTestsPanel onStart={onStart} onPoll={onPoll} pollIntervalMs={1000} />);
    await user.click(getTestsButton());
    await act(async () => { jest.advanceTimersByTime(1000); await Promise.resolve(); });
    expect(screen.queryByText(longStdout)).not.toBeInTheDocument();
    expect(await screen.findAllByRole('button', { name: /copy/i })).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: /show full stdout/i }));
    expect(await screen.findByText(longStdout)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /collapse/i }));
    expect(screen.queryByText(longStdout)).not.toBeInTheDocument();
  });

  it('expands long stderr output independently', async () => {
    useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const longStderr = 'e'.repeat(9001);
    const onStart = jest.fn().mockResolvedValue({ runId: 'stderr-run' });
    const onPoll = jest.fn().mockResolvedValueOnce({ ...baseResult, status: 'failed' as const, stdout: 'ok', stderr: longStderr, failed: 1, total: 1 });
    render(<RunTestsPanel onStart={onStart} onPoll={onPoll} pollIntervalMs={1000} />);
    await user.click(getTestsButton());
    await act(async () => { jest.advanceTimersByTime(1200); await Promise.resolve(); });
    expect(screen.queryByText(longStderr, { exact: false })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /show full stderr/i }));
    expect(await screen.findByText(longStderr)).toBeInTheDocument();
  });

  it('handles clipboard failures and missing clipboard gracefully', async () => {
    useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onStart = jest.fn().mockResolvedValue({ runId: 'copy-run' });
    const onPoll = jest.fn().mockResolvedValueOnce({ ...baseResult, status: 'failed' as const, stdout: 'short', stderr: 'err', failed: 1, total: 1 });
    const writeMock = jest.fn().mockRejectedValue(new Error('nope'));
    Object.defineProperty(global.navigator, 'clipboard', { configurable: true, value: { writeText: writeMock } });
    render(<RunTestsPanel onStart={onStart} onPoll={onPoll} pollIntervalMs={10} />);
    await user.click(screen.getByRole('button'));
    await act(async () => { jest.advanceTimersByTime(1100); await Promise.resolve(); });
    const copyButtons = await screen.findAllByRole('button', { name: /Copy/i });
    await user.click(copyButtons[0]);
    expect(writeMock).toHaveBeenCalled();
    const globalWithNav = globalThis as unknown as { navigator?: { clipboard?: { writeText: jest.Mock } } };
    if (globalWithNav.navigator) delete globalWithNav.navigator.clipboard;
    await user.click(copyButtons[1]);
  });

  it('handles empty stderr output display', async () => {
    useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onStart = jest.fn().mockResolvedValue({ runId: 'empty-stderr' });
    const onPoll = jest.fn().mockResolvedValueOnce({ ...baseResult, status: 'failed' as const, stdout: 'some output', stderr: '   ', failed: 1, total: 1 });
    render(<RunTestsPanel onStart={onStart} onPoll={onPoll} pollIntervalMs={100} />);
    await user.click(getTestsButton());
    await act(async () => { jest.advanceTimersByTime(1500); await Promise.resolve(); await Promise.resolve(); });
    expect(screen.getByText(/Stderr: No output captured/i)).toBeInTheDocument();
  });
});
