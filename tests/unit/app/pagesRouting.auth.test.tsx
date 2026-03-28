import { render, screen } from '@testing-library/react';
import './pagesRouting.mocks';

describe('app route auth pages', () => {
  it('renders auth login and logout pages', async () => {
    const { default: LoginPage } = await import('@/app/(auth)/auth/login/page');
    const { default: LogoutPage } =
      await import('@/app/(auth)/auth/logout/page');
    render(await LoginPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    render(await LogoutPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByTestId('logout-page')).toBeInTheDocument();
  });

  it('renders auth error page', async () => {
    const { default: ErrorPage } = await import('@/app/(auth)/auth/error/page');
    const el = await ErrorPage({ searchParams: Promise.resolve({}) });
    render(el);
    expect(screen.getByTestId('auth-error-page')).toBeInTheDocument();
  });
});
