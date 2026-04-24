import { render, screen } from '@testing-library/react';
import { InviteBadges } from '@/features/candidate/portal/components/InviteBadges';
import type { CandidateInvite } from '@/features/candidate/session/api';

const baseInvite: CandidateInvite = {
  candidateSessionId: 1,
  token: 't',
  title: 'Trial',
  role: 'Engineer',
  company: 'Winoe',
  status: 'in_progress',
  progress: { completed: 1, total: 5 },
  expiresAt: null,
  lastActivityAt: null,
  isExpired: false,
};

describe('InviteBadges', () => {
  it('renders status pill using the five-day state model', () => {
    render(<InviteBadges invite={baseInvite} />);
    expect(screen.getByText(/Day 2 open/i)).toBeInTheDocument();
  });

  it('shows expired pill when invite is expired', () => {
    render(
      <InviteBadges
        invite={{ ...baseInvite, isExpired: true, status: 'expired' }}
      />,
    );
    expect(screen.getByText(/Expired/i)).toBeInTheDocument();
  });
});
