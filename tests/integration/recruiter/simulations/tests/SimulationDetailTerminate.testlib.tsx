import '../../../setup/paramsMock';
import { setMockParams } from '../../../setup/paramsMock';
import React from 'react';
import {
  getRequestUrl,
  jsonResponse,
  textResponse,
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

const simulationDetailResponse = (status = 'active_inviting') =>
  jsonResponse({
    id: '1',
    status,
    title: 'Simulation 1',
    templateKey: 'python-fastapi',
    role: 'Backend Engineer',
    techStack: 'Python + FastAPI',
    focus: 'API design',
    scenario: 'Build a billing service.',
    tasks: [],
  });

const candidatesResponse = () =>
  jsonResponse([
    {
      candidateSessionId: 2,
      inviteEmail: 'jane@example.com',
      candidateName: 'Jane Doe',
      status: 'in_progress',
      startedAt: '2025-12-23T18:57:00.000000Z',
      completedAt: null,
      hasReport: false,
      inviteUrl: 'https://example.com/invite/abc',
      inviteEmailStatus: 'sent',
    },
  ]);

export function resetTerminateIntegrationState() {
  __resetCandidateCache();
  __resetHttpClientCache();
  setMockParams({ id: '1' });
}

export function installTerminateFetchMock(
  terminateResolver: (init?: RequestInit) => Response,
) {
  const fetchMock = jest.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getRequestUrl(input);
      if (url === '/api/simulations/1') return simulationDetailResponse();
      if (url === '/api/simulations/1/candidates') return candidatesResponse();
      if (url === '/api/simulations/1/terminate' && init?.method === 'POST') {
        return terminateResolver(init);
      }
      return textResponse('Not found', 404);
    },
  );

  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}
