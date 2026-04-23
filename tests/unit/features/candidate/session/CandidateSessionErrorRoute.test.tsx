import { render, screen } from '@testing-library/react';
import { CandidateSessionErrorRoute } from '@/features/candidate/session/CandidateSessionErrorRoute';
import {
  INVITE_EXPIRED_MESSAGE,
  INVITE_INVALID_MESSAGE,
} from '@/platform/copy/invite';

const props = {
  loginHref: '/auth/login?mode=candidate',
  onRetryInit: jest.fn(),
  onGoHome: jest.fn(),
} as never;

describe('CandidateSessionErrorRoute', () => {
  it('renders a distinct invalid invite state', () => {
    render(
      <CandidateSessionErrorRoute
        props={props}
        authStatus="ready"
        errorMessage={null}
        errorStatus={400}
        inviteErrorCopy={INVITE_INVALID_MESSAGE}
      />,
    );

    expect(screen.getByText('Invalid invite')).toBeInTheDocument();
    expect(screen.getByText(INVITE_INVALID_MESSAGE)).toBeInTheDocument();
  });

  it('renders a distinct expired invite state', () => {
    render(
      <CandidateSessionErrorRoute
        props={props}
        authStatus="ready"
        errorMessage={null}
        errorStatus={410}
        inviteErrorCopy={INVITE_EXPIRED_MESSAGE}
      />,
    );

    expect(screen.getByText('Invite expired')).toBeInTheDocument();
    expect(screen.getByText(INVITE_EXPIRED_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText(/already used/i)).toBeNull();
  });
});
