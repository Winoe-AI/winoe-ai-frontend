import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getRequestUrl, jsonResponse } from '../../../../setup/responseHelpers';
import {
  installTerminateFetchMock,
  resetTerminateIntegrationState,
} from './SimulationDetailTerminate.testlib';
import RecruiterSimulationDetailPage from '@/features/recruiter/simulation-management/detail/RecruiterSimulationDetailPage';

describe('Simulation detail terminate flow', () => {
  beforeEach(() => {
    resetTerminateIntegrationState();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('terminates and disables invite/resend while showing cleanup message', async () => {
    const user = userEvent.setup();
    const fetchMock = installTerminateFetchMock(() =>
      jsonResponse({
        simulationId: 1,
        status: 'terminated',
        cleanupJobIds: ['cleanup-job-1'],
      }),
    );

    render(<RecruiterSimulationDetailPage />);
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /invite candidate/i }),
      ).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /invite candidate/i }));
    expect(
      await screen.findByRole('button', { name: /^send invite$/i }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: /^terminate simulation$/i }),
    );

    const modal = await screen.findByTestId('terminate-simulation-modal');
    const confirmButton = within(modal).getByRole('button', {
      name: /^terminate simulation$/i,
    });
    await user.click(
      within(modal).getByLabelText('confirm-terminate-simulation'),
    );
    await user.click(confirmButton);

    expect(await screen.findByText('Cleanup in progress…')).toBeInTheDocument();
    expect(screen.getByText('Job IDs: cleanup-job-1')).toBeInTheDocument();
    expect(screen.getAllByText('Terminated').length).toBeGreaterThan(0);
    expect(
      screen.getByRole('button', { name: /invite candidate/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /resend invite/i }),
    ).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: /^send invite$/i }),
    ).not.toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(
        ([request, init]) =>
          getRequestUrl(request as RequestInfo | URL) ===
            '/api/simulations/1/terminate' &&
          (init as RequestInit | undefined)?.method === 'POST',
      ),
    ).toBe(true);
  });
});
