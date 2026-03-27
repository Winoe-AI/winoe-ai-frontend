import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { textResponse } from '../../../../setup/responseHelpers';
import {
  installTerminateFetchMock,
  resetTerminateIntegrationState,
} from './SimulationDetailTerminate.testlib';
import RecruiterSimulationDetailPage from '@/features/recruiter/simulations/detail/RecruiterSimulationDetailPage';

describe('Simulation detail terminate access handling', () => {
  beforeEach(() => {
    resetTerminateIntegrationState();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows access blocked state when terminate returns 403', async () => {
    const user = userEvent.setup();
    installTerminateFetchMock(() => textResponse('Forbidden', 403));

    render(<RecruiterSimulationDetailPage />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^terminate simulation$/i })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /^terminate simulation$/i }));
    const modal = await screen.findByTestId('terminate-simulation-modal');
    await user.click(within(modal).getByLabelText('confirm-terminate-simulation'));
    await user.click(within(modal).getByRole('button', { name: /^terminate simulation$/i }));

    expect(await screen.findByText('Not authorized')).toBeInTheDocument();
  });
});
