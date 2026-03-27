import { render, screen } from '@testing-library/react';
import { resetAuthPageMocks } from './authPages.testlib';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href} data-testid="link">{children}</a>
  ),
}));

jest.mock('@/shared/layout/AppShell', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  ),
}));

describe('routes coverage auth + global errors', () => {
  beforeEach(() => {
    resetAuthPageMocks();
  });

  it('renders auth routes with sanitized params', async () => {
    const { default: LoginRoute } = await import('@/app/(auth)/auth/login/page');
    render(await LoginRoute({ searchParams: Promise.resolve({ returnTo: ' /return ', mode: 'candidate' }) }));
    expect(screen.getByText(/\/return\|candidate/i)).toBeInTheDocument();

    const { default: LogoutRoute } = await import('@/app/(auth)/auth/logout/page');
    render(await LogoutRoute());
    expect(screen.getByTestId('logout-mock')).toBeInTheDocument();

    const { default: AuthErrorRoute } = await import('@/app/(auth)/auth/error/page');
    render(await AuthErrorRoute({ searchParams: Promise.resolve({ returnTo: '/home', error: 'oops', errorCode: 'bad', errorId: 'err1', cleared: '1' }) }));
    expect(screen.getByTestId('auth-error-mock').textContent).toContain('"cleared":true');
  });

  it('renders not-authorized page and layout', async () => {
    const { default: NotAuthorizedPage } = await import('@/app/(auth)/not-authorized/page');
    render(await NotAuthorizedPage({ searchParams: Promise.resolve({ mode: 'recruiter', returnTo: '/dest' }) }));
    expect(screen.getAllByTestId('link')[1]).toHaveAttribute('href', '/dest');

    const { default: NotAuthorizedLayout } = await import('@/app/(auth)/not-authorized/layout');
    render(NotAuthorizedLayout({ children: <div data-testid="na-child" /> }));
    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
  });

  it('renders global error with retry and hides digest in production', async () => {
    const { default: GlobalError } = await import('@/app/global-error');
    const reset = jest.fn();
    const first = render(GlobalError({ error: Object.assign(new Error('boom'), { digest: '123' }), reset }));
    screen.getByRole('button', { name: /Retry/i }).click();
    expect(reset).toHaveBeenCalled();
    first.unmount();

    render(GlobalError({ error: new Error('fail'), reset: jest.fn() }));
    expect(screen.queryByText(/Error id/)).not.toBeInTheDocument();
  });
});
