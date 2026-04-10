import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InviteCard } from '@/features/candidate/portal/components/InviteCard';
import type { CandidateInvite } from '@/features/candidate/session/api';

const baseInvite: CandidateInvite = {
  candidateSessionId: 1,
  token: null,
  title: 'Backend Trial',
  role: 'Backend Engineer',
  company: 'Winoe',
  status: 'not_started',
  progress: { completed: 0, total: 5 },
  expiresAt: null,
  lastActivityAt: null,
  isExpired: false,
};

describe('InviteCard', () => {
  it('disables continue when no token available', async () => {
    const onContinue = jest.fn();
    render(
      <InviteCard
        invite={baseInvite}
        fallbackToken={null}
        onContinue={onContinue}
      />,
    );

    const button = screen.getByRole('button', { name: /start trial/i });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onContinue).not.toHaveBeenCalled();
  });

  it('enables continue when fallback token provided', async () => {
    const onContinue = jest.fn();
    render(
      <InviteCard
        invite={baseInvite}
        fallbackToken="fallback-token"
        onContinue={onContinue}
      />,
    );

    const button = screen.getByRole('button', { name: /start trial/i });
    expect(button).toBeEnabled();
    await userEvent.click(button);
    expect(onContinue).toHaveBeenCalled();
  });
});
