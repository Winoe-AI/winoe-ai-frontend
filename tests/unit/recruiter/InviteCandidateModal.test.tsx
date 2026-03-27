import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { InviteCandidateModal } from '@/features/recruiter/invitations/InviteCandidateModal';

const renderModal = (overrides: Partial<ComponentProps<typeof InviteCandidateModal>> = {}) =>
  render(
    <InviteCandidateModal
      open
      title="Test Simulation"
      state={{ status: 'idle' }}
      onClose={() => undefined}
      onSubmit={() => undefined}
      initialName=""
      initialEmail=""
      {...overrides}
    />,
  );

describe('InviteCandidateModal', () => {
  it('passes string values to submit handler', () => {
    const onSubmit = jest.fn();
    renderModal({ onSubmit });
    fireEvent.change(screen.getByLabelText(/Candidate name/i), { target: { value: '  Jane Doe  ' } });
    fireEvent.change(screen.getByLabelText(/Candidate email/i), { target: { value: '  JANE@EXAMPLE.COM  ' } });
    fireEvent.click(screen.getByText('Send invite'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const [name, email] = onSubmit.mock.calls[0] as [unknown, unknown];
    expect(typeof name).toBe('string');
    expect(typeof email).toBe('string');
    expect(name).toBe('  Jane Doe  ');
    expect(email).toBe('  JANE@EXAMPLE.COM  ');
  });

  it('hydrates initial values when opened', async () => {
    const { rerender } = renderModal({ open: false });
    rerender(
      <InviteCandidateModal
        open
        title="Test Simulation"
        state={{ status: 'idle' }}
        onClose={() => undefined}
        onSubmit={() => undefined}
        initialName="Ada Lovelace"
        initialEmail="ada@example.com"
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Candidate name/i)).toHaveValue('Ada Lovelace');
      expect(screen.getByLabelText(/Candidate email/i)).toHaveValue('ada@example.com');
    });
  });

  it('blocks submit when candidate name is missing', () => {
    const onSubmit = jest.fn();
    renderModal({ onSubmit });
    fireEvent.change(screen.getByLabelText(/Candidate email/i), { target: { value: 'jane@example.com' } });
    fireEvent.click(screen.getByText('Send invite'));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/Candidate name is required/i)).toBeInTheDocument();
  });

  it('renders nothing when closed and still resets when opened later', () => {
    const { rerender, queryByRole, getByLabelText, getByText } = renderModal({
      open: false,
      title: 'Later',
      onSubmit: jest.fn(),
      initialName: 'Closed Name',
      initialEmail: 'closed@example.com',
    });

    expect(queryByRole('dialog')).toBeNull();

    rerender(
      <InviteCandidateModal
        open
        title="Later"
        state={{ status: 'idle' }}
        onClose={() => undefined}
        onSubmit={jest.fn()}
        initialName="Opened Name"
        initialEmail="opened@example.com"
      />,
    );

    expect(getByLabelText(/Candidate name/i)).toHaveValue('Opened Name');
    expect(getByLabelText(/Candidate email/i)).toHaveValue('opened@example.com');
    fireEvent.click(getByText('Send invite'));
  });
});
