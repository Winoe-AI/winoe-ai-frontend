import { act, renderHook, waitFor } from '@testing-library/react';
import { useDashboardQuery } from '@/features/talent-partner/dashboard/hooks/useDashboardQuery';

const fetchDashboard = jest.fn();

jest.mock('@/features/talent-partner/dashboard/hooks/useDashboardApi', () => ({
  fetchDashboard: (...args: unknown[]) => fetchDashboard(...args),
  isAbortError: (err: unknown) =>
    (err as { name?: string })?.name === 'AbortError',
}));

describe('useDashboardQuery', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    fetchDashboard.mockReset();
    fetchDashboard.mockResolvedValue({
      profile: null,
      trials: [],
      profileError: null,
      trialsError: null,
      requestId: 'rid',
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('fetches on mount', async () => {
    const { result } = renderHook(() => useDashboardQuery());
    act(() => {
      jest.runOnlyPendingTimers();
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(fetchDashboard).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(result.current.requestId).toBe('rid');
    });
  });
});
