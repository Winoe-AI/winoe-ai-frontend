import { act, waitFor } from '@testing-library/react';
import {
  deferred,
  fetchDashboard,
  restoreLocation,
  setupDashboardHook,
} from './useDashboardData.testlib';

describe('useDashboardData', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    restoreLocation();
  });

  it('fetches profile and trials and surfaces results', async () => {
    fetchDashboard.mockResolvedValueOnce({
      profile: { name: 'TalentPartner', email: 'r@test.com', role: 'Hiring' },
      trials: [
        {
          id: '1',
          title: 'Trial 1',
          role: 'Eng',
          createdAt: '2024-01-01',
          candidateCount: 0,
        },
      ],
      profileError: null,
      trialsError: null,
    });

    const { result } = setupDashboardHook();
    expect(result.current.loadingProfile).toBe(true);
    expect(result.current.loadingTrials).toBe(true);

    await waitFor(() =>
      expect(result.current.profile?.name).toBe('TalentPartner'),
    );
    expect(result.current.trials).toHaveLength(1);
    expect(result.current.loadingProfile).toBe(false);
    expect(result.current.loadingTrials).toBe(false);
    expect(result.current.profileError).toBeNull();
    expect(result.current.trialsError).toBeNull();
  });

  it('dedupes concurrent refresh calls and preserves loading transitions', async () => {
    const pending = deferred<unknown>();
    fetchDashboard.mockReturnValueOnce(pending.promise);
    const { result } = setupDashboardHook(false);

    await act(async () => {
      void result.current.refresh(false);
      void result.current.refresh(false);
    });
    expect(fetchDashboard).toHaveBeenCalledTimes(1);

    pending.resolve({
      profile: { name: 'R', email: 'r@test.com' },
      trials: [
        {
          id: '1',
          title: 'Trial 1',
          role: 'Eng',
          createdAt: '2024-01-01',
          candidateCount: 0,
        },
        {
          id: '2',
          title: 'Trial 2',
          role: 'Eng',
          createdAt: '2024-01-02',
          candidateCount: 0,
        },
      ],
      profileError: null,
      trialsError: null,
    });

    await waitFor(() => expect(result.current.trials).toHaveLength(2));
    expect(result.current.loadingProfile).toBe(false);
    expect(result.current.loadingTrials).toBe(false);
  });

  it('surfaces errors for non-auth failures', async () => {
    fetchDashboard.mockRejectedValueOnce(new Error('fail'));
    const { result } = setupDashboardHook();

    await waitFor(() => expect(result.current.profileError).toBe('fail'));
    expect(result.current.trialsError).toBe('fail');
  });

  it('ignores abort errors without setting error state', async () => {
    fetchDashboard.mockRejectedValueOnce(
      new DOMException('Aborted', 'AbortError'),
    );
    const { result } = setupDashboardHook();

    await waitFor(() => expect(result.current.loadingProfile).toBe(false));
    expect(result.current.profileError).toBeNull();
    expect(result.current.trialsError).toBeNull();
  });
});
