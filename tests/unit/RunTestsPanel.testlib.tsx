import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RunTestsPanel } from '@/features/candidate/session/task/components/RunTestsPanel';

const realConsoleError = console.error;
const originalNavigator = global.navigator;
export const notifyMock = jest.fn();
export const baseResult = { passed: null, failed: null, total: null, stdout: null, stderr: null, workflowUrl: null, commitSha: null };
export const getTestsButton = () => screen.getByRole('button', { name: /^(run|re-run|retry|running)\s+tests/i });

jest.mock('@/shared/notifications', () => ({ useNotifications: () => ({ notify: notifyMock }) }));
jest.mock('@/lib/errors/errors', () => {
  const actual = jest.requireActual('@/lib/errors/errors');
  return {
    ...actual,
    normalizeApiError: jest.fn((err: unknown, fallback?: string) => ({
      message: err instanceof Error ? err.message : typeof err === 'string' ? err : (fallback ?? 'normalized'),
    })),
  };
});

let timersAreFake = false;
export const useFakeTimers = () => {
  timersAreFake = true;
  jest.useFakeTimers();
};
export const restoreRealTimers = () => {
  jest.useRealTimers();
  timersAreFake = false;
};

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((message, ...args) => {
    if (typeof message === 'string' && (message.includes('not wrapped in act') || message.includes('without await'))) return;
    realConsoleError(message, ...args);
  });
});
afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});
afterEach(() => {
  if (timersAreFake) {
    act(() => {
      jest.runOnlyPendingTimers();
    });
  }
  act(() => {});
  restoreRealTimers();
  notifyMock.mockReset();
  try {
    sessionStorage.clear();
  } catch {}
  global.navigator = originalNavigator;
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
});

export { act, render, screen, userEvent, RunTestsPanel };
