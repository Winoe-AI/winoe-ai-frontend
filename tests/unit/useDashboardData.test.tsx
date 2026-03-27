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

  it('fetches profile and simulations and surfaces results', async () => {
    fetchDashboard.mockResolvedValueOnce({
      profile: { name: 'Recruiter', email: 'r@test.com', role: 'Hiring' },
      simulations: [
        { id: '1', title: 'Sim', role: 'Eng', createdAt: '2024-01-01' },
      ],
      profileError: null,
      simulationsError: null,
    });

    const { result } = setupDashboardHook();
    expect(result.current.loadingProfile).toBe(true);
    expect(result.current.loadingSimulations).toBe(true);

    await waitFor(() => expect(result.current.profile?.name).toBe('Recruiter'));
    expect(result.current.simulations).toHaveLength(1);
    expect(result.current.loadingProfile).toBe(false);
    expect(result.current.loadingSimulations).toBe(false);
    expect(result.current.profileError).toBeNull();
    expect(result.current.simError).toBeNull();
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
      simulations: [
        { id: '1', title: 'Sim', role: 'Eng', createdAt: '2024-01-01' },
        { id: '2', title: 'Sim 2', role: 'Eng', createdAt: '2024-01-02' },
      ],
      profileError: null,
      simulationsError: null,
    });

    await waitFor(() => expect(result.current.simulations).toHaveLength(2));
    expect(result.current.loadingProfile).toBe(false);
    expect(result.current.loadingSimulations).toBe(false);
  });

  it('surfaces errors for non-auth failures', async () => {
    fetchDashboard.mockRejectedValueOnce(new Error('fail'));
    const { result } = setupDashboardHook();

    await waitFor(() => expect(result.current.profileError).toBe('fail'));
    expect(result.current.simError).toBe('fail');
  });

  it('ignores abort errors without setting error state', async () => {
    fetchDashboard.mockRejectedValueOnce(
      new DOMException('Aborted', 'AbortError'),
    );
    const { result } = setupDashboardHook();

    await waitFor(() => expect(result.current.loadingProfile).toBe(false));
    expect(result.current.profileError).toBeNull();
    expect(result.current.simError).toBeNull();
  });
});
