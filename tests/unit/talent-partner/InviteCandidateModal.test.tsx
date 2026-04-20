import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { InviteCandidateModal } from '@/features/talent-partner/trial-management/invitations/InviteCandidateModal';

const renderModal = (
  overrides: Partial<ComponentProps<typeof InviteCandidateModal>> = {},
) =>
  render(
    <InviteCandidateModal
      open
      title="Test Trial"
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
    fireEvent.change(screen.getByLabelText(/Candidate name/i), {
      target: { value: '  Jane Doe  ' },
    });
    fireEvent.change(screen.getByLabelText(/Candidate email/i), {
      target: { value: '  JANE@EXAMPLE.COM  ' },
    });
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
        title="Test Trial"
        state={{ status: 'idle' }}
        onClose={() => undefined}
        onSubmit={() => undefined}
        initialName="Ada Lovelace"
        initialEmail="ada@example.com"
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Candidate name/i)).toHaveValue(
        'Ada Lovelace',
      );
      expect(screen.getByLabelText(/Candidate email/i)).toHaveValue(
        'ada@example.com',
      );
    });
  });

  it('blocks submit when candidate name is missing', () => {
    const onSubmit = jest.fn();
    renderModal({ onSubmit });
    fireEvent.change(screen.getByLabelText(/Candidate email/i), {
      target: { value: 'jane@example.com' },
    });
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
    expect(getByLabelText(/Candidate email/i)).toHaveValue(
      'opened@example.com',
    );
    fireEvent.click(getByText('Send invite'));
  });

  it('renders a success confirmation with a copyable invite URL', async () => {
    const onClose = jest.fn();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
      configurable: true,
    });

    render(
      <InviteCandidateModal
        open
        title="Test Trial"
        state={{
          status: 'success',
          message: 'Invite sent.',
          inviteUrl: 'https://example.com/candidate/session/token-123',
          candidateName: 'Jane Doe',
          candidateEmail: 'jane@example.com',
          outcome: 'created',
        }}
        onClose={onClose}
        onSubmit={() => undefined}
        initialName=""
        initialEmail=""
      />,
    );

    expect(screen.getByTestId('invite-success')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Invite candidate/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Invite URL/i)).toHaveValue(
      'https://example.com/candidate/session/token-123',
    );
    expect(screen.queryByText(/evidence/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Copy invite URL/i }));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Copied/i }),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: /Done/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders a delivery warning with a copyable invite URL', async () => {
    const onClose = jest.fn();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
      configurable: true,
    });

    render(
      <InviteCandidateModal
        open
        title="Test Trial"
        state={{
          status: 'warning',
          message:
            'Invite link created, but email delivery was rate limited. Copy the invite URL and retry later.',
          inviteUrl: 'https://example.com/candidate/session/invite-token',
          candidateName: 'Jane Doe',
          candidateEmail: 'jane@example.com',
          candidateSessionId: '99',
          outcome: 'created',
          inviteEmailStatus: 'rate_limited',
        }}
        onClose={onClose}
        onSubmit={() => undefined}
        initialName=""
        initialEmail=""
      />,
    );

    expect(screen.getByTestId('invite-success')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Invite link created, but email delivery was rate limited/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Invite URL/i)).toHaveValue(
      'https://example.com/candidate/session/invite-token',
    );
    expect(
      screen.getByRole('button', { name: /Copy invite URL/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Copy invite URL/i }));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Copied/i }),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: /Done/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
