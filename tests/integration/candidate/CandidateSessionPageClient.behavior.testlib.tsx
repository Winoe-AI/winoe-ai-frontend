import { screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { __resetHttpClientCache } from '@/platform/api-client/client';
import { renderCandidateWithProviders } from '../../setup';

export const routerMock = {
  push: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
};

jest.mock('next/navigation', () => ({ useRouter: () => routerMock }));

export const fetchMock = jest.fn();
const realFetch = global.fetch;

export const CandidateSessionPage = (
  jest.requireActual('@/features/candidate/session/CandidateSessionPage') as {
    default: (props: { token: string }) => React.JSX.Element;
  }
).default;

export const setSessionPath = (token: string) => {
  window.history.replaceState(
    {},
    '',
    `/candidate/session/${encodeURIComponent(token)}`,
  );
};

export const resetBehaviorEnv = (token = 'valid-token') => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  __resetHttpClientCache();
  Object.values(routerMock).forEach((fn) => fn.mockReset());
  sessionStorage.clear();
  localStorage.clear();
  setSessionPath(token);
};

export const restoreFetch = () => {
  global.fetch = realFetch;
};

export const renderSessionPage = (token: string) =>
  renderCandidateWithProviders(<CandidateSessionPage token={token} />);

export const baseSession = (overrides: Record<string, unknown> = {}) => ({
  candidateSessionId: 321,
  status: 'in_progress',
  trial: { title: 'Infra Trial', role: 'Backend Engineer' },
  scheduledStartAt: null,
  candidateTimezone: null,
  dayWindows: [],
  scheduleLockedAt: null,
  currentDayWindow: null,
  ...overrides,
});

export const sampleWindows = [
  {
    dayIndex: 1,
    windowStartAt: '2099-01-01T14:00:00Z',
    windowEndAt: '2099-01-01T22:00:00Z',
  },
  {
    dayIndex: 2,
    windowStartAt: '2099-01-02T14:00:00Z',
    windowEndAt: '2099-01-02T22:00:00Z',
  },
];

export const fillScheduleAndContinue = async (user: UserEvent) => {
  expect(await screen.findByText(/Pick your start date/i)).toBeInTheDocument();
  const startDateInput = screen.getByLabelText('Start date');
  await user.clear(startDateInput);
  await user.type(startDateInput, '2099-01-01');
  const timezoneInput = screen.getByLabelText('Timezone');
  await user.clear(timezoneInput);
  await user.type(timezoneInput, 'America/New_York');
  await user.click(screen.getByRole('button', { name: /Continue/i }));
};
