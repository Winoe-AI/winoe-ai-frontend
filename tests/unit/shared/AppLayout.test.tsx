import { render, screen } from '@testing-library/react';
import React from 'react';
import { AppNav } from '@/shared/layout/AppNav';

jest.mock('next/link', () => {
  function LinkMock({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }
  return LinkMock;
});

jest.mock('@/platform/auth0', () => ({
  auth0: {
    getSession: jest.fn(),
  },
  getSessionNormalized: jest.fn(),
  getCachedSessionNormalized: jest.fn(),
}));
describe('shared layout components', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders AppNav links only when authed', () => {
    const { rerender } = render(<AppNav isAuthed={false} />);
    expect(screen.queryByText(/Dashboard/i)).toBeNull();

    rerender(<AppNav isAuthed />);
    expect(screen.queryByText(/Recruiter Dashboard/i)).toBeNull();
    expect(screen.queryByText(/Candidate Portal/i)).toBeNull();
    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
  });

  it('renders role-scoped nav links without cross-portal items', () => {
    const { rerender } = render(
      <AppNav
        isAuthed
        navScope="candidate"
        permissions={['candidate:access']}
      />,
    );
    expect(screen.getByText(/Candidate Portal/i)).toBeInTheDocument();
    expect(screen.queryByText(/Recruiter Dashboard/i)).toBeNull();

    rerender(
      <AppNav
        isAuthed
        navScope="recruiter"
        permissions={['recruiter:access']}
      />,
    );
    expect(screen.getByText(/Recruiter Dashboard/i)).toBeInTheDocument();
    expect(screen.queryByText(/Candidate Portal/i)).toBeNull();
  });

  it('allows scoped portal links when permissions are empty', () => {
    const { rerender } = render(<AppNav isAuthed navScope="candidate" />);
    expect(screen.getByText(/Candidate Portal/i)).toBeInTheDocument();
    expect(screen.queryByText(/Recruiter Dashboard/i)).toBeNull();

    rerender(<AppNav isAuthed navScope="recruiter" />);
    expect(screen.getByText(/Recruiter Dashboard/i)).toBeInTheDocument();
    expect(screen.queryByText(/Candidate Portal/i)).toBeNull();
  });

  it('hides portal links for auth or marketing scope', () => {
    const { rerender } = render(<AppNav isAuthed navScope="auth" />);
    expect(screen.queryByText(/Recruiter Dashboard/i)).toBeNull();
    expect(screen.queryByText(/Candidate Portal/i)).toBeNull();

    rerender(<AppNav isAuthed navScope="marketing" />);
    expect(screen.queryByText(/Recruiter Dashboard/i)).toBeNull();
    expect(screen.queryByText(/Candidate Portal/i)).toBeNull();
  });
});
