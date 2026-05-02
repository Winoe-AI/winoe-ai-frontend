import { render, screen } from '@testing-library/react';
import { CandidateSessionErrorRoute } from '@/features/candidate/session/CandidateSessionErrorRoute';
import type { CandidateSessionViewProps } from '@/features/candidate/session/views/types';

const baseProps: Partial<CandidateSessionViewProps> = {
  loginHref: '/auth/login?mode=candidate',
  onDashboard: jest.fn(),
  onRetryInit: jest.fn(),
  onGoHome: jest.fn(),
};

describe('CandidateSessionErrorRoute', () => {
  it('renders a distinct invalid invite state', () => {
    render(
      <CandidateSessionErrorRoute
        props={
          {
            ...baseProps,
            inviteErrorState: 'invalid',
            inviteContactName: null,
            inviteContactEmail: null,
          } as CandidateSessionViewProps
        }
      />,
    );

    expect(screen.getByText('This invite link is invalid')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Email support/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Email support/i }),
    ).toHaveAttribute('href', 'mailto:support@winoe.ai');
  });

  it('renders a distinct expired invite state', () => {
    render(
      <CandidateSessionErrorRoute
        props={
          {
            ...baseProps,
            inviteErrorState: 'expired',
            inviteContactName: 'Jordan',
            inviteContactEmail: 'jordan.partner@winoe.ai',
          } as CandidateSessionViewProps
        }
      />,
    );

    expect(screen.getByText('This invite has expired')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Email Jordan/i }),
    ).toBeInTheDocument();
  });

  it('renders already claimed guidance without an auth redirect surface', () => {
    render(
      <CandidateSessionErrorRoute
        props={
          {
            ...baseProps,
            inviteErrorState: 'already_claimed',
            inviteContactName: null,
            inviteContactEmail: null,
          } as CandidateSessionViewProps
        }
      />,
    );

    expect(
      screen.getByText('This invite has already been claimed'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Continue to sign in/i }),
    ).toBeInTheDocument();
  });
});
