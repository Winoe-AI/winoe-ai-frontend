import '../../../setup/paramsMock';
import { setMockParams } from '../../../setup/paramsMock';
import React from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecruiterSimulationDetailPage from '@/features/recruiter/simulation-management/detail/RecruiterSimulationDetailPage';
import {
  getRequestUrl,
  jsonResponse,
  textResponse,
  type MockResponse,
} from '../../../../setup/responseHelpers';
import { __resetCandidateCache } from '@/features/recruiter/api';
import { __resetHttpClientCache } from '@/platform/api-client/client';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

export const simulationListResponse = () =>
  jsonResponse([
    { id: '1', title: 'Simulation 1', templateKey: 'python-fastapi' },
  ]);
export const simulationDetailResponse = () =>
  jsonResponse({
    id: '1',
    status: 'active_inviting',
    title: 'Simulation 1',
    templateKey: 'python-fastapi',
    role: 'Backend Engineer',
    techStack: 'Python + FastAPI',
    focus: 'API design',
    ai: {
      evalEnabledByDay: {
        '1': true,
        '2': true,
        '3': true,
        '4': false,
        '5': true,
      },
    },
    scenario: 'Build a billing service for a growing marketplace.',
    tasks: [
      {
        dayIndex: 1,
        title: 'Kickoff',
        description: 'Review requirements and outline the approach.',
        rubric: ['Clarity', 'Scope'],
      },
      {
        dayIndex: 2,
        title: 'Implementation',
        description: 'Build the payments endpoint.',
        rubric: 'Matches spec with clean error handling.',
        repoUrl: 'https://github.com/acme/day2',
        preProvisioned: true,
      },
      {
        dayIndex: 3,
        title: 'Debugging',
        description: 'Fix failing tests in the repo.',
        rubric: ['Root cause analysis'],
        repoFullName: 'acme/day3',
        preProvisioned: false,
      },
    ],
  });

export const installFetchMock = (
  impl: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response | MockResponse>,
) => {
  const fetchMock = jest.fn(impl);
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
};

beforeEach(() => {
  __resetCandidateCache();
  __resetHttpClientCache();
  setMockParams({ id: '1' });
  installFetchMock(async (input: RequestInfo | URL) => {
    const url = getRequestUrl(input);
    if (url === '/api/simulations') return simulationListResponse();
    if (url === '/api/simulations/1') return simulationDetailResponse();
    if (url === '/api/simulations/1/candidates') {
      return jsonResponse([
        {
          candidateSessionId: 2,
          inviteEmail: 'jane@example.com',
          candidateName: 'Jane Doe',
          status: 'in_progress',
          startedAt: '2025-12-23T18:57:00.000000Z',
          completedAt: null,
          hasReport: false,
        },
        {
          candidateSessionId: 3,
          inviteEmail: 'bob@example.com',
          candidateName: null,
          status: 'completed',
          startedAt: '2025-12-23T10:00:00.000000Z',
          completedAt: '2025-12-23T12:00:00.000000Z',
          hasReport: false,
        },
      ]);
    }
    return textResponse('Not found', 404);
  });
});
afterEach(() => {
  jest.resetAllMocks();
  jest.useRealTimers();
});

export {
  React,
  act,
  render,
  screen,
  waitFor,
  within,
  userEvent,
  getRequestUrl,
  jsonResponse,
  textResponse,
  RecruiterSimulationDetailPage,
};
