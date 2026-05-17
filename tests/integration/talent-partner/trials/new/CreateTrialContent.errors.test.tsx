import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createTrialV4Mock,
  resetCreateTrialMocks,
  routerMock,
} from './CreateTrialContent.testlib';
import TrialCreatePage from '@/features/talent-partner/trial-management/create/TrialCreatePage';

describe('NewTrialWizard errors', () => {
  beforeEach(() => {
    resetCreateTrialMocks();
  });

  it('shows create error when v4 create fails', async () => {
    const user = userEvent.setup();
    createTrialV4Mock.mockResolvedValue({
      ok: false,
      status: 400,
      trialId: '',
      jobId: '',
      message: 'Bad input',
    });

    render(<TrialCreatePage />);

    await user.type(screen.getByLabelText(/Role title/i), 'Backend Engineer');
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    await user.type(
      screen.getByLabelText(/Tell Winoe about the work/i),
      'Enough context for the Trial focus notes field here.',
    );
    await user.click(
      screen.getByRole('button', { name: /Generate Trial preview/i }),
    );

    expect(
      await screen.findByText(/Winoe could not start drafting this Trial/i),
    ).toBeInTheDocument();
    expect(routerMock.push).not.toHaveBeenCalled();
  });

  it('navigates to trials list from Cancel on step 1', async () => {
    const user = userEvent.setup();
    render(<TrialCreatePage />);

    await user.click(screen.getByRole('button', { name: /^Cancel$/i }));
    expect(routerMock.push).toHaveBeenCalledWith('/talent-partner/trials');
  });
});
