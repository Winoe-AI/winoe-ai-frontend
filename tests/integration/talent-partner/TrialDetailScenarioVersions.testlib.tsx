import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TalentPartnerTrialDetailPage from '@/features/talent-partner/trial-management/detail/TalentPartnerTrialDetailPage';
import { NotificationsProvider } from '@/shared/notifications';
import { __resetCandidateCache } from '@/features/talent-partner/api';
import { __resetHttpClientCache } from '@/platform/api-client/client';
import { jsonResponse, type MockResponse } from '../../setup/responseHelpers';

export const params = { id: 'trial-1' };
jest.mock('next/navigation', () => ({ useParams: () => params }));
export const fetchMock = jest.fn();
const realFetch = global.fetch;

export const getUrl = (input: RequestInfo | URL) => {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
};

type HandlerResponse = Response | MockResponse;
type Handler =
  | HandlerResponse
  | (() => HandlerResponse | Promise<HandlerResponse>);

export function buildDetail(overrides: Record<string, unknown> = {}) {
  const base = {
    id: 'trial-1',
    status: 'ready_for_review',
    title: 'Trial trial-1',
    templateKey: 'python-fastapi',
    activeScenarioVersionId: 10,
    pendingScenarioVersionId: null,
    scenarioVersions: [
      { id: 10, versionIndex: 1, status: 'ready', lockedAt: null },
    ],
    scenario: {
      id: 10,
      versionIndex: 1,
      status: 'ready',
      lockedAt: null,
      storylineMd: 'Story v1',
      taskPromptsJson: [
        {
          dayIndex: 1,
          title: 'Day 1 task',
          description: 'Implement day one API endpoint.',
        },
      ],
      rubricJson: { dayWeights: { '1': 100 }, dimensions: [] },
      notes: 'Base notes',
    },
    tasks: [
      {
        dayIndex: 1,
        title: 'Day 1 task',
        description: 'Implement day one API endpoint.',
      },
    ],
  };
  const merged = { ...base, ...overrides } as Record<string, unknown>;
  if ('scenario' in overrides && typeof overrides.scenario === 'object')
    merged.scenario = {
      ...(base.scenario as Record<string, unknown>),
      ...(overrides.scenario as Record<string, unknown>),
    };
  return merged;
}

export const mockFetchHandlers = (handlers: Record<string, Handler>) => {
  const resolvedHandlers: Record<string, Handler> = {
    '/api/trials': jsonResponse([
      { id: 'trial-1', title: 'Trial trial-1', templateKey: 'python-fastapi' },
    ]),
    '/api/trials/trial-1': jsonResponse(buildDetail()),
    '/api/trials/trial-1/candidates': jsonResponse([]),
    ...handlers,
  };
  fetchMock.mockImplementation((input: RequestInfo | URL) => {
    const handler = resolvedHandlers[getUrl(input)];
    if (!handler) return jsonResponse({ message: 'Not found' }, 404);
    return typeof handler === 'function' ? handler() : handler;
  });
};

export const renderPage = () =>
  render(
    <NotificationsProvider>
      <TalentPartnerTrialDetailPage />
    </NotificationsProvider>,
  );

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  params.id = 'trial-1';
  __resetCandidateCache();
  __resetHttpClientCache();
  jest.useRealTimers();
});
afterAll(() => {
  global.fetch = realFetch;
});

export { act, userEvent, screen, waitFor, within, jsonResponse };
