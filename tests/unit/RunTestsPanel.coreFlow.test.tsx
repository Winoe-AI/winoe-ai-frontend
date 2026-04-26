import { waitFor } from '@testing-library/react';
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

describe('RunTestsPanel - core flow', () => {
  it('starts a run and polls until success', async () => {
    useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onStart = jest.fn().mockResolvedValue({ runId: 'run-1' });
    const onPoll = jest
      .fn()
      .mockResolvedValueOnce({ ...baseResult, status: 'running' as const })
      .mockResolvedValueOnce({
        ...baseResult,
        status: 'passed' as const,
        message: 'Checks green',
        passed: 4,
        failed: 0,
        total: 4,
        stdout: 'ok',
        stderr: '',
        workflowUrl: 'https://github.com/acme/repo/actions/runs/1',
        commitSha: 'abc123def',
      });
    render(
      <RunTestsPanel onStart={onStart} onPoll={onPoll} pollIntervalMs={1000} />,
    );
    await user.click(getTestsButton());
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('status')).toHaveTextContent(
      /Preparing test run/i,
    );
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        /Tests are running/i,
      ),
    );
    expect(
      (
        await screen.findByRole('button', { name: /Running tests/i })
      ).hasAttribute('disabled'),
    ).toBe(true);
    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });
    await act(async () => {
      jest.advanceTimersByTime(1600);
      await Promise.resolve();
    });
    expect(onPoll).toHaveBeenCalledTimes(2);
    expect(await screen.findByText(/Checks green/i)).toBeInTheDocument();
    expect((await screen.findAllByText(/Passed/i)).length).toBeGreaterThan(0);
    expect(
      await screen.findByRole('link', { name: /workflow run/i }),
    ).toHaveAttribute('href', 'https://github.com/acme/repo/actions/runs/1');
    expect(await screen.findByText(/Commit/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /re-run tests/i })).toBeEnabled();
  });

  it('honors server pollAfterMs for the next poll', async () => {
    useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onStart = jest.fn().mockResolvedValue({ runId: 'run-delay' });
    const onPoll = jest
      .fn()
      .mockResolvedValueOnce({
        ...baseResult,
        status: 'running' as const,
        pollAfterMs: 2500,
      })
      .mockResolvedValueOnce({
        ...baseResult,
        status: 'passed' as const,
      });
    render(
      <RunTestsPanel onStart={onStart} onPoll={onPoll} pollIntervalMs={1000} />,
    );
    await user.click(getTestsButton());
    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });
    expect(onPoll).toHaveBeenCalledTimes(1);
    await act(async () => {
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
    });
    expect(onPoll).toHaveBeenCalledTimes(1);
    await act(async () => {
      jest.advanceTimersByTime(500);
      await Promise.resolve();
    });
    expect(onPoll).toHaveBeenCalledTimes(2);
  });

  it('disables start button when window gate is read-only', async () => {
    const onStart = jest.fn().mockResolvedValue({ runId: 'run-disabled' });
    const onPoll = jest
      .fn()
      .mockResolvedValue({ ...baseResult, status: 'running' as const });
    render(
      <RunTestsPanel
        onStart={onStart}
        onPoll={onPoll}
        disabled
        disabledReason="This day is not open yet."
      />,
    );
    const cta = screen.getByRole('button', { name: /run tests unavailable/i });
    expect(cta).toBeDisabled();
    expect(screen.getByText(/This day is not open yet/i)).toBeInTheDocument();
    expect(onStart).not.toHaveBeenCalled();
  });

  it('stops polling once a terminal status is reached', async () => {
    useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onStart = jest.fn().mockResolvedValue({ runId: 'stop-loop' });
    const onPoll = jest
      .fn()
      .mockResolvedValueOnce({ ...baseResult, status: 'running' as const })
      .mockResolvedValueOnce({ ...baseResult, status: 'passed' as const });
    render(
      <RunTestsPanel onStart={onStart} onPoll={onPoll} pollIntervalMs={500} />,
    );
    await user.click(getTestsButton());
    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });
    await act(async () => {
      jest.advanceTimersByTime(1500);
      await Promise.resolve();
    });
    expect(onPoll).toHaveBeenCalledTimes(2);
    await act(async () => {
      jest.advanceTimersByTime(3000);
      await Promise.resolve();
    });
    expect(onPoll).toHaveBeenCalledTimes(2);
  });

  it('prevents duplicate runs while running and allows retry after failure', async () => {
    useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onStart = jest.fn().mockResolvedValue({ runId: 'r-2' });
    const onPoll = jest.fn().mockResolvedValueOnce({
      ...baseResult,
      status: 'failed' as const,
      message: 'Red',
      failed: 2,
      total: 2,
    });
    render(
      <RunTestsPanel onStart={onStart} onPoll={onPoll} pollIntervalMs={1000} />,
    );
    const cta = getTestsButton();
    await user.click(cta);
    await user.click(cta);
    expect(onStart).toHaveBeenCalledTimes(1);
    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });
    expect(onPoll).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/Red/)).toBeInTheDocument();
    await user.click(getTestsButton());
    expect(onStart).toHaveBeenCalledTimes(2);
  });

  it('ignores rapid double clicks before state updates', async () => {
    useFakeTimers();
    const onStart = jest.fn().mockResolvedValue({ runId: 'fast' });
    const onPoll = jest
      .fn()
      .mockResolvedValue({ ...baseResult, status: 'running' as const });
    render(
      <RunTestsPanel onStart={onStart} onPoll={onPoll} pollIntervalMs={1000} />,
    );
    const cta = getTestsButton();
    act(() => {
      cta.click();
      cta.click();
    });
    await act(async () => Promise.resolve());
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
