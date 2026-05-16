import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { textResponse } from '../../../../setup/responseHelpers';
import {
  installTerminateFetchMock,
  openTerminateTrialFromHeader,
  resetTerminateIntegrationState,
} from './TrialDetailTerminate.testlib';
import TalentPartnerTrialDetailPage from '@/features/talent-partner/trial-management/detail/TalentPartnerTrialDetailPage';

describe('Trial detail terminate access handling', () => {
  beforeEach(() => {
    resetTerminateIntegrationState();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows access blocked state when terminate returns 403', async () => {
    const user = userEvent.setup();
    installTerminateFetchMock(() => textResponse('Forbidden', 403));

    render(<TalentPartnerTrialDetailPage />);
    await waitFor(() =>
      expect(
        screen.getByTestId('trial-detail-overflow-menu'),
      ).toBeInTheDocument(),
    );

    await openTerminateTrialFromHeader(user);
    const modal = await screen.findByTestId('terminate-trial-modal');
    await user.click(within(modal).getByLabelText('confirm-terminate-trial'));
    await user.click(
      within(modal).getByRole('button', { name: /^terminate trial$/i }),
    );

    expect(await screen.findByText('Not authorized')).toBeInTheDocument();
  });
});
