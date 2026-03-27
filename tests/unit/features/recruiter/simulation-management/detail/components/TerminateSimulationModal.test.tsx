import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TerminateSimulationModal } from '@/features/recruiter/simulation-management/detail/components/TerminateSimulationModal';

describe('TerminateSimulationModal', () => {
  it('does not render when closed', () => {
    render(
      <TerminateSimulationModal
        open={false}
        pending={false}
        onClose={() => {}}
        onConfirm={() => {}}
      />,
    );
    expect(
      screen.queryByTestId('terminate-simulation-modal'),
    ).not.toBeInTheDocument();
  });

  it('requires explicit confirmation before enabling terminate', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();

    render(
      <TerminateSimulationModal
        open={true}
        pending={false}
        onClose={() => {}}
        onConfirm={onConfirm}
      />,
    );

    const terminateButton = screen.getByRole('button', {
      name: /terminate simulation/i,
    });
    expect(terminateButton).toBeDisabled();

    await user.click(screen.getByLabelText('confirm-terminate-simulation'));
    expect(terminateButton).toBeEnabled();

    await user.click(terminateButton);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('disables controls while request is pending', () => {
    render(
      <TerminateSimulationModal
        open={true}
        pending={true}
        onClose={() => {}}
        onConfirm={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    expect(
      screen.getByLabelText('confirm-terminate-simulation'),
    ).toBeDisabled();
  });
});
