import { waitFor } from '@testing-library/react';
import {
  fetchDashboard,
  restoreLocation,
  setupDashboardHook,
  stubLocation,
} from './useDashboardData.testlib';

describe('useDashboardData auth redirects and options', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    restoreLocation();
  });

  it('redirects to login on 401 responses', async () => {
    const assignMock = stubLocation();
    fetchDashboard.mockImplementationOnce(() => {
      window.location.assign('/auth/login?returnTo=/x');
      const error = new Error('unauthorized') as Error & { status?: number };
      error.status = 401;
      return Promise.reject(error);
    });

    const { result } = setupDashboardHook();
    await waitFor(() => expect(assignMock).toHaveBeenCalled());
    await waitFor(() => expect(result.current.loadingProfile).toBe(false));
    expect(assignMock.mock.calls[0]?.[0]).toContain('/auth/login?');
  });

  it('redirects to not authorized on 403 responses', async () => {
    const assignMock = stubLocation();
    fetchDashboard.mockImplementationOnce(() => {
      window.location.assign('/not-authorized?returnTo=/x');
      const error = new Error('forbidden') as Error & { status?: number };
      error.status = 403;
      return Promise.reject(error);
    });

    const { result } = setupDashboardHook();
    await waitFor(() => expect(assignMock).toHaveBeenCalled());
    await waitFor(() => expect(result.current.loadingProfile).toBe(false));
    expect(assignMock.mock.calls[0]?.[0]).toContain('/not-authorized?');
  });

  it('skips fetch on mount when fetchOnMount is false', () => {
    setupDashboardHook(false);
    expect(fetchDashboard).toHaveBeenCalledTimes(0);
  });
});
