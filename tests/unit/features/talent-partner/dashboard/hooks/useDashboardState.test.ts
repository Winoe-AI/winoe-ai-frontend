import { makeInitialDashboardState } from '@/features/talent-partner/dashboard/hooks/useDashboardState';

describe('makeInitialDashboardState', () => {
  it('uses defaults when options are omitted', () => {
    const result = makeInitialDashboardState();

    expect(result).toEqual({
      profile: null,
      trials: [],
      requestId: null,
      profileError: null,
      trialsError: null,
      loadingProfile: true,
      loadingTrials: true,
    });
  });

  it('hydrates initial profile and profile error values', () => {
    const result = makeInitialDashboardState({
      initialProfile: { id: 9, name: 'Jordan' } as never,
      initialProfileError: 'profile unavailable',
    });

    expect(result.profile).toEqual({ id: 9, name: 'Jordan' });
    expect(result.profileError).toBe('profile unavailable');
    expect(result.trialsError).toBeNull();
  });

  it('disables loading states when fetchOnMount=false', () => {
    const result = makeInitialDashboardState({ fetchOnMount: false });

    expect(result.loadingProfile).toBe(false);
    expect(result.loadingTrials).toBe(false);
  });
});
