import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TerminateTrialModal } from '@/features/talent-partner/trial-management/detail/components/TerminateTrialModal';

describe('TerminateTrialModal', () => {
  it('does not render when closed', () => {
    render(
      <TerminateTrialModal
        open={false}
        pending={false}
        onClose={() => {}}
        onConfirm={() => {}}
      />,
    );
    expect(
      screen.queryByTestId('terminate-trial-modal'),
    ).not.toBeInTheDocument();
  });

  it('requires explicit confirmation before enabling terminate', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();

    render(
      <TerminateTrialModal
        open={true}
        pending={false}
        onClose={() => {}}
        onConfirm={onConfirm}
      />,
    );

    const terminateButton = screen.getByRole('button', {
      name: /terminate trial/i,
    });
    expect(terminateButton).toBeDisabled();

    await user.click(screen.getByLabelText('confirm-terminate-trial'));
    expect(terminateButton).toBeEnabled();

    await user.click(terminateButton);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('disables controls while request is pending', () => {
    render(
      <TerminateTrialModal
        open={true}
        pending={true}
        onClose={() => {}}
        onConfirm={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    expect(screen.getByLabelText('confirm-terminate-trial')).toBeDisabled();
  });
});
