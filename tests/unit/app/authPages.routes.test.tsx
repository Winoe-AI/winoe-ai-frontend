import { render, screen } from '@testing-library/react';
import {
  authErrorMock,
  loginMock,
  logoutMock,
  modeForPathMock,
  resetAuthPageMocks,
  sanitizeReturnToMock,
} from './authPages.testlib';

describe('auth route entrypoints', () => {
  beforeEach(() => {
    resetAuthPageMocks();
  });

  it('auth error page defaults when search params are missing', async () => {
    const { default: AuthErrorRoutePage } =
      await import('@/app/(auth)/auth/error/page');
    render(await AuthErrorRoutePage({ searchParams: undefined }));
    expect(authErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        returnTo: undefined,
        mode: undefined,
        error: undefined,
        errorCode: undefined,
        errorId: undefined,
        cleared: false,
      }),
    );
  });

  it('login page resolves search params and defaults unknown mode', async () => {
    const { default: LoginRoutePage } =
      await import('@/app/(auth)/auth/login/page');
    render(await LoginRoutePage({ searchParams: undefined }));
    expect(loginMock).toHaveBeenCalledWith({
      returnTo: undefined,
      mode: undefined,
    });

    render(
      await LoginRoutePage({
        searchParams: Promise.resolve({ returnTo: ' /dest ', mode: 'unknown' }),
      }),
    );
    expect(sanitizeReturnToMock).toHaveBeenCalledWith(' /dest ');
    expect(loginMock).toHaveBeenCalledWith({
      returnTo: '/dest',
      mode: undefined,
    });
  });

  it('logout page renders', async () => {
    const { default: LogoutRoutePage } =
      await import('@/app/(auth)/auth/logout/page');
    render(await LogoutRoutePage());
    expect(logoutMock).toHaveBeenCalled();
  });

  it('auth error page derives mode and cleared flag', async () => {
    const { default: AuthErrorRoutePage } =
      await import('@/app/(auth)/auth/error/page');
    render(
      await AuthErrorRoutePage({
        searchParams: Promise.resolve({
          returnTo: '/candidate/dashboard',
          error: 'boom',
          errorCode: 'bad',
          errorId: 'id1',
          cleared: 'true',
        }),
      }),
    );
    expect(modeForPathMock).toHaveBeenCalled();
    expect(authErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        returnTo: '/candidate/dashboard',
        mode: 'candidate',
        cleared: true,
      }),
    );
  });

  it('not-authorized page renders links for recruiter mode', async () => {
    const { default: NotAuthorizedPage } =
      await import('@/app/(auth)/not-authorized/page');
    render(
      await NotAuthorizedPage({
        searchParams: Promise.resolve({ mode: 'recruiter', returnTo: '/dash' }),
      }),
    );
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/candidate/dashboard');
    expect(links[1]).toHaveAttribute('href', '/dash');
  });

  it('not-authorized page uses candidate returnTo and recruiter default path', async () => {
    const { default: NotAuthorizedPage } =
      await import('@/app/(auth)/not-authorized/page');
    render(
      await NotAuthorizedPage({
        searchParams: Promise.resolve({ mode: 'candidate', returnTo: '/cand' }),
      }),
    );
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/cand');
    expect(links[1]).toHaveAttribute('href', '/dashboard');
  });
});
