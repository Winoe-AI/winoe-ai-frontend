import '../../../setup/paramsMock';
import { setMockParams } from '../../../setup/paramsMock';
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecruiterSimulationDetailPage from '@/features/recruiter/simulations/detail/RecruiterSimulationDetailPage';
import {
  getRequestUrl,
  jsonResponse,
  textResponse,
} from '../../../../setup/responseHelpers';
import { __resetCandidateCache } from '@/features/recruiter/api';
import { __resetHttpClientCache } from '@/lib/api/client';

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

describe('Simulation detail terminate flow', () => {
  beforeEach(() => {
    __resetCandidateCache();
    __resetHttpClientCache();
    setMockParams({ id: '1' });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('terminates without refresh and disables invite/resend while showing cleanup message', async () => {
    const user = userEvent.setup();
    const fetchMock = jest.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = getRequestUrl(input);
        if (url === '/api/simulations/1') return simulationDetailResponse();
        if (url === '/api/simulations/1/candidates')
          return candidatesResponse();
        if (url === '/api/simulations/1/terminate' && init?.method === 'POST') {
          return jsonResponse({
            simulationId: 1,
            status: 'terminated',
            cleanupJobIds: ['cleanup-job-1'],
          });
        }
        return textResponse('Not found', 404);
      },
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<RecruiterSimulationDetailPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /invite candidate/i }),
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole('button', { name: /^terminate simulation$/i }),
    );

    const modal = await screen.findByTestId('terminate-simulation-modal');
    const confirmButton = within(modal).getByRole('button', {
      name: /^terminate simulation$/i,
    });
    expect(confirmButton).toBeDisabled();

    await user.click(
      within(modal).getByLabelText('confirm-terminate-simulation'),
    );
    expect(confirmButton).toBeEnabled();
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('Cleanup in progress…')).toBeInTheDocument();
    });

    expect(screen.getByText('Job IDs: cleanup-job-1')).toBeInTheDocument();
    expect(screen.getAllByText('Terminated').length).toBeGreaterThan(0);
    expect(
      screen.getByRole('button', { name: /invite candidate/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /resend invite/i }),
    ).toBeDisabled();

    expect(
      fetchMock.mock.calls.some(
        ([request, init]) =>
          getRequestUrl(request as RequestInfo | URL) ===
            '/api/simulations/1/terminate' &&
          (init as RequestInit | undefined)?.method === 'POST',
      ),
    ).toBe(true);
  });

  it('shows access blocked state when terminate returns 403', async () => {
    const user = userEvent.setup();
    const fetchMock = jest.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = getRequestUrl(input);
        if (url === '/api/simulations/1') return simulationDetailResponse();
        if (url === '/api/simulations/1/candidates')
          return candidatesResponse();
        if (url === '/api/simulations/1/terminate' && init?.method === 'POST') {
          return textResponse('Forbidden', 403);
        }
        return textResponse('Not found', 404);
      },
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<RecruiterSimulationDetailPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /^terminate simulation$/i }),
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole('button', { name: /^terminate simulation$/i }),
    );
    const modal = await screen.findByTestId('terminate-simulation-modal');
    await user.click(
      within(modal).getByLabelText('confirm-terminate-simulation'),
    );
    await user.click(
      within(modal).getByRole('button', { name: /^terminate simulation$/i }),
    );

    await waitFor(() => {
      expect(screen.getByText('Not authorized')).toBeInTheDocument();
    });
  });
});
