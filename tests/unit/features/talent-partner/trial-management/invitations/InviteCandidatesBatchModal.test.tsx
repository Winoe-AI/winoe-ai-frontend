/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  InviteCandidatesBatchModal,
  formatInviteBatchFailureMessage,
} from '@/features/talent-partner/trial-management/invitations/InviteCandidatesBatchModal';
import type { InviteBatchUiState } from '@/features/talent-partner/trial-management/invitations/InviteBatchCandidateTypes';

jest.mock('@/features/talent-partner/utils/formattersUtils', () => ({
  copyInviteLink: jest.fn().mockResolvedValue(undefined),
}));

function renderModal(state: InviteBatchUiState) {
  const onClose = jest.fn();
  const onSubmit = jest.fn();
  render(
    <InviteCandidatesBatchModal
      open
      title="Acme · Senior Engineer"
      state={state}
      onClose={onClose}
      onSubmit={onSubmit}
    />,
  );
  return { onClose, onSubmit };
}

describe('formatInviteBatchFailureMessage', () => {
  it('replaces SQLAlchemy / asyncpg errors with a safe message', () => {
    const raw =
      '(sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) column "workspace_provisioning_status" does not exist [SQL: INSERT INTO workspaces';
    expect(formatInviteBatchFailureMessage(raw)).toBe(
      'Something went wrong on our side while preparing this invite. Please try again in a moment. If this keeps happening, contact support.',
    );
  });

  it('passes through normal product errors', () => {
    expect(formatInviteBatchFailureMessage('Trial has been terminated.')).toBe(
      'Trial has been terminated.',
    );
  });
});

describe('InviteCandidatesBatchModal', () => {
  it('requires full name and email', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal({ status: 'idle' });

    await user.click(screen.getByRole('button', { name: /Send invite/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      screen.getAllByText('Full name is required.').length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText('Email is required.').length).toBeGreaterThan(0);
  });

  it('rejects duplicate emails in the modal', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal({ status: 'idle' });

    await user.type(screen.getByLabelText(/Full name \(row 1\)/i), 'A');
    await user.type(
      screen.getByLabelText(/Email \(row 1\)/i),
      'dup@example.com',
    );

    await user.click(
      screen.getByRole('button', { name: /Add another candidate/i }),
    );

    const nameFields = screen.getAllByLabelText(/Full name \(row/i);
    const emailFields = screen.getAllByLabelText(/Email \(row/i);
    await user.type(nameFields[1]!, 'B');
    await user.type(emailFields[1]!, 'dup@example.com');

    expect(
      screen.getByText('Duplicate email in this list.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Send 2 invites/i }),
    ).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('sends multiple candidates when valid', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal({ status: 'idle' });

    await user.type(
      screen.getByLabelText(/Full name \(row 1\)/i),
      'Jordan Smith',
    );
    await user.type(
      screen.getByLabelText(/Email \(row 1\)/i),
      'jordan@example.com',
    );
    await user.click(
      screen.getByRole('button', { name: /Add another candidate/i }),
    );

    const nameFields = screen.getAllByLabelText(/Full name \(row/i);
    const emailFields = screen.getAllByLabelText(/Email \(row/i);
    await user.type(nameFields[1]!, 'Sam Lee');
    await user.type(emailFields[1]!, 'sam@example.com');

    await user.click(screen.getByRole('button', { name: /Send 2 invites/i }));

    expect(onSubmit).toHaveBeenCalledWith([
      { name: 'Jordan Smith', email: 'jordan@example.com' },
      { name: 'Sam Lee', email: 'sam@example.com' },
    ]);
  });

  it('shows copyable invite URLs after success', () => {
    renderModal({
      status: 'success',
      message: '2 invites sent.',
      invites: [
        {
          candidateSessionId: 'cs1',
          name: 'Jordan Smith',
          email: 'jordan@example.com',
          inviteUrl: 'https://app.test/invite/jordan',
          status: 'sent',
        },
        {
          candidateSessionId: 'cs2',
          name: 'Sam Lee',
          email: 'sam@example.com',
          inviteUrl: 'https://app.test/invite/sam',
          status: 'sent',
        },
      ],
    });

    expect(screen.getByTestId('invite-batch-success')).toBeInTheDocument();
    expect(screen.getByText('2 invites sent.')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('https://app.test/invite/jordan'),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('https://app.test/invite/sam'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
  });

  it('shows per-row failures in success state', () => {
    renderModal({
      status: 'success',
      message: '1 invite sent; 1 failed. Review errors below.',
      invites: [
        {
          candidateSessionId: 'cs1',
          name: 'Jordan Smith',
          email: 'jordan@example.com',
          inviteUrl: 'https://app.test/invite/jordan',
          status: 'sent',
        },
        {
          candidateSessionId: '',
          name: 'Bad Row',
          email: 'bad@example.com',
          inviteUrl: '',
          status: 'failed',
          errorMessage: 'Trial has been terminated.',
        },
      ],
    });

    expect(screen.getByText(/Could not send/i)).toBeInTheDocument();
    expect(screen.getByText('Trial has been terminated.')).toBeInTheDocument();
  });

  it('sanitizes ORM errors in failed invite rows', () => {
    const sqlish =
      '(sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) column "x" does not exist [SQL: INSERT INTO workspaces';
    renderModal({
      status: 'success',
      message: 'No invites were sent (1 failed). Review the errors below.',
      invites: [
        {
          candidateSessionId: '',
          name: 'Bad Row',
          email: 'bad@example.com',
          inviteUrl: '',
          status: 'failed',
          errorMessage: sqlish,
        },
      ],
    });

    expect(
      screen.getByText(
        'Something went wrong on our side while preparing this invite. Please try again in a moment. If this keeps happening, contact support.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(sqlish)).not.toBeInTheDocument();
  });
});
