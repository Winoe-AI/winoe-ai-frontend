import { renderHook } from '@testing-library/react';
import { useDashboardData } from '@/features/talent-partner/dashboard/hooks/useDashboardData';

export const fetchDashboard = jest.fn();

jest.mock('@/features/talent-partner/dashboard/hooks/useDashboardApi', () => ({
  fetchDashboard: (...args: unknown[]) => fetchDashboard(...args),
  isAbortError: (err: unknown) =>
    err instanceof DOMException && err.name === 'AbortError',
}));

type Deferred<T> = { promise: Promise<T>; resolve: (value: T) => void };

export function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

export function setupDashboardHook(fetchOnMount = true) {
  return renderHook(() => useDashboardData({ fetchOnMount }));
}

export const originalLocation = window.location;

export function stubLocation(assign = jest.fn()) {
  Object.defineProperty(window, 'location', {
    value: { assign, origin: 'http://app.test' } as unknown as Location,
    writable: true,
    configurable: true,
  });
  return assign;
}

export function restoreLocation() {
  Object.defineProperty(window, 'location', {
    value: originalLocation,
    writable: true,
    configurable: true,
  });
}
