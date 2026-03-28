import { act, renderHook } from '@testing-library/react';
import { useDashboardRefresh } from '@/features/recruiter/dashboard/hooks/useDashboardRefresh';
import type { DashboardState } from '@/features/recruiter/dashboard/hooks/useDashboardState';

const useAsyncLoaderMock = jest.fn();
const fetchDashboardMock = jest.fn();
const logPerfMock = jest.fn();

jest.mock('@/shared/hooks', () => ({
  useAsyncLoader: (...args: unknown[]) => useAsyncLoaderMock(...args),
}));

jest.mock('@/features/recruiter/dashboard/hooks/useDashboardApi', () => ({
  fetchDashboard: (...args: unknown[]) => fetchDashboardMock(...args),
  isAbortError: (err: unknown) =>
    Boolean(
      err &&
        typeof err === 'object' &&
        (err as { name?: string }).name === 'AbortError',
    ),
}));

jest.mock('@/features/recruiter/dashboard/utils/perfUtils', () => ({
  dashboardPerfDebugEnabled: true,
  logPerf: (...args: unknown[]) => logPerfMock(...args),
  nowMs: () => 444,
}));

describe('useDashboardRefresh', () => {
  let state: DashboardState;
  let setState: jest.Mock;
  let loadMock: jest.Mock;
  let abortMock: jest.Mock;
  let capturedLoader: ((signal?: AbortSignal) => Promise<unknown>) | null;
  let capturedOptions:
    | {
        onSuccess?: (value: any) => void;
        onError?: (error: unknown) => string | null;
      }
    | null;

  beforeEach(() => {
    jest.clearAllMocks();

    state = {
      profile: null,
      simulations: [],
      requestId: null,
      profileError: null,
      simError: null,
      loadingProfile: false,
      loadingSimulations: false,
    };

    setState = jest.fn((updater: React.SetStateAction<DashboardState>) => {
      state = typeof updater === 'function' ? updater(state) : updater;
    });

    loadMock = jest.fn().mockResolvedValue({});
    abortMock = jest.fn();
    capturedLoader = null;
    capturedOptions = null;

    useAsyncLoaderMock.mockImplementation(
      (
        loader: (signal?: AbortSignal) => Promise<unknown>,
        options: {
          onSuccess?: (value: unknown) => void;
          onError?: (error: unknown) => string | null;
        },
      ) => {
        capturedLoader = loader;
        capturedOptions = options;
        return { load: loadMock, abort: abortMock };
      },
    );
  });

  it('returns existing inflight promise when force=false', () => {
    const inflight = Promise.resolve({ profile: null, simulations: [] });
    const refs = {
      inflightRef: { current: inflight },
      controllerRef: { current: null },
      requestSeqRef: { current: 3 },
    };

    const { result } = renderHook(() => useDashboardRefresh(setState, refs));

    const next = result.current.refresh(false);

    expect(next).toBe(inflight);
    expect(loadMock).not.toHaveBeenCalled();
    expect(refs.requestSeqRef.current).toBe(3);
  });

  it('aborts previous controller, marks loading, and stores inflight run', async () => {
    const priorAbort = jest.fn();
    const inflight = Promise.resolve({
      profile: { name: 'R' },
      simulations: [],
      profileError: null,
      simulationsError: null,
      requestId: 'rid',
    });
    loadMock.mockReturnValue(inflight);

    const refs = {
      inflightRef: { current: null as Promise<any> | null },
      controllerRef: {
        current: { abort: priorAbort } as unknown as AbortController,
      },
      requestSeqRef: { current: 0 },
    };

    const { result } = renderHook(() => useDashboardRefresh(setState, refs));
    const run = result.current.refresh();

    expect(priorAbort).toHaveBeenCalledTimes(1);
    expect(refs.controllerRef.current).toBeNull();
    expect(refs.requestSeqRef.current).toBe(1);
    expect(loadMock).toHaveBeenCalledWith(true);
    expect(refs.inflightRef.current).toBe(inflight);
    expect(state.loadingProfile).toBe(true);
    expect(state.loadingSimulations).toBe(true);
    expect(run).toBe(inflight);
  });

  it('passes signal through loader to fetchDashboard', async () => {
    fetchDashboardMock.mockResolvedValue({ profile: null, simulations: [] });
    const refs = {
      inflightRef: { current: null },
      controllerRef: { current: null },
      requestSeqRef: { current: 0 },
    };

    renderHook(() => useDashboardRefresh(setState, refs));

    const signal = new AbortController().signal;
    await capturedLoader?.(signal);

    expect(fetchDashboardMock).toHaveBeenCalledWith(signal);
  });

  it('handles success state transitions', () => {
    const refs = {
      inflightRef: { current: null },
      controllerRef: { current: null },
      requestSeqRef: { current: 0 },
    };

    renderHook(() => useDashboardRefresh(setState, refs));

    act(() => {
      capturedOptions?.onSuccess?.({
        profile: { name: 'Recruiter' },
        simulations: [{ id: 'sim-1' }],
        requestId: 'req-1',
        profileError: null,
        simulationsError: null,
      });
    });

    expect(state.profile).toEqual({ name: 'Recruiter' });
    expect(state.simulations).toEqual([{ id: 'sim-1' }]);
    expect(state.requestId).toBe('req-1');
    expect(state.loadingProfile).toBe(false);
    expect(state.loadingSimulations).toBe(false);
    expect(logPerfMock).toHaveBeenCalledWith('/api/dashboard response', 444, {
      status: 200,
    });
  });

  it('handles abort error transitions without surfacing a message', () => {
    const refs = {
      inflightRef: { current: null },
      controllerRef: { current: null },
      requestSeqRef: { current: 0 },
    };

    renderHook(() => useDashboardRefresh(setState, refs));

    let returned: string | null | undefined;
    act(() => {
      returned = capturedOptions?.onError?.({ name: 'AbortError' });
    });

    expect(returned).toBeNull();
    expect(state.loadingProfile).toBe(false);
    expect(state.loadingSimulations).toBe(false);
    expect(state.profileError).toBeNull();
    expect(state.simError).toBeNull();
  });

  it('handles non-abort errors and sets user-facing error state', () => {
    const refs = {
      inflightRef: { current: null },
      controllerRef: { current: null },
      requestSeqRef: { current: 0 },
    };

    renderHook(() => useDashboardRefresh(setState, refs));

    let returned: string | null | undefined;
    act(() => {
      returned = capturedOptions?.onError?.(new Error('dashboard failed'));
    });

    expect(returned).toBe('dashboard failed');
    expect(state.profileError).toBe('dashboard failed');
    expect(state.simError).toBe('dashboard failed');
    expect(state.loadingProfile).toBe(false);
    expect(state.loadingSimulations).toBe(false);
    expect(logPerfMock).toHaveBeenCalledWith('/api/dashboard response', 444, {
      status: 'error',
    });
  });

  it('returns abort function from useAsyncLoader controls', () => {
    const refs = {
      inflightRef: { current: null },
      controllerRef: { current: null },
      requestSeqRef: { current: 0 },
    };

    const { result } = renderHook(() => useDashboardRefresh(setState, refs));

    result.current.abort();
    expect(abortMock).toHaveBeenCalledTimes(1);
  });
});
