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

const trialDetailResponse = () =>
  jsonResponse({
    id: params.id,
    status: 'active_inviting',
    title: `Trial ${params.id}`,
    templateKey: 'python-fastapi',
    role: 'Backend Engineer',
    techStack: 'Node.js + Postgres',
    preferredLanguageFramework: 'Node.js + Postgres',
    focus: 'Payments',
    scenario: 'Design a billing service for a SaaS platform.',
    rubricSummary: 'Judge correctness, clarity, and resilience.',
    tasks: [
      {
        dayIndex: 1,
        title: 'Discovery',
        description: 'Define requirements.',
        rubric: ['Clarity'],
      },
      {
        dayIndex: 2,
        title: 'Implementation',
        description: 'Implement API routes.',
        rubric: 'Correctness',
        repoUrl: 'https://github.com/acme/day2',
        preProvisioned: true,
      },
      {
        dayIndex: 3,
        title: 'Debugging',
        description: 'Fix failing tests.',
        rubric: ['Root cause'],
        repoFullName: 'acme/day3',
        preProvisioned: false,
      },
    ],
  });

export const getUrl = (input: RequestInfo | URL) => {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
};

type HandlerResponse = Response | MockResponse;
type Handler =
  | HandlerResponse
  | (() => HandlerResponse | Promise<HandlerResponse>);

export const mockFetchHandlers = (handlers: Record<string, Handler>) => {
  const resolvedHandlers = {
    [`/api/trials/${params.id}`]: trialDetailResponse,
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
  jest.useRealTimers();
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  params.id = 'trial-1';
  __resetCandidateCache();
  __resetHttpClientCache();
});
afterEach(() => {
  jest.useRealTimers();
});
afterAll(() => {
  global.fetch = realFetch;
});

export { act, userEvent, screen, waitFor, within, jsonResponse };
