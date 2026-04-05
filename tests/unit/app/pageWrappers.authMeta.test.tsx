import React from 'react';
import { render } from '@testing-library/react';
import { resetPageWrapperMocks } from './pageWrappers.testlib';

describe('route wrapper metadata', () => {
  beforeEach(() => {
    resetPageWrapperMocks();
  });

  it('exposes root layout metadata and viewport', async () => {
    const {
      metadata,
      viewport,
      default: RootLayout,
    } = await import('@/app/layout');
    expect(metadata?.title).toBeDefined();
    expect(viewport?.width).toBe('device-width');

    const element = RootLayout({ children: <div data-testid="child">ok</div> });
    expect(React.isValidElement(element)).toBe(true);
    expect(element.type).toBe('html');
  });

  it('loads auth route metadata and components', async () => {
    const { generateMetadata: generateLoginMetadata, default: LoginRoute } =
      await import('@/app/(auth)/auth/login/page');
    const loginMeta = await generateLoginMetadata({
      searchParams: Promise.resolve({ returnTo: '/foo', mode: 'candidate' }),
    });
    expect(loginMeta.title).toBeDefined();
    render(
      await LoginRoute({
        searchParams: Promise.resolve({ returnTo: '/foo', mode: 'candidate' }),
      }),
    );

    const { metadata: logoutMeta, default: LogoutRoute } =
      await import('@/app/(auth)/auth/logout/page');
    expect(logoutMeta.title).toBeDefined();
    render(await LogoutRoute());

    const { metadata: authErrorMeta } =
      await import('@/app/(auth)/auth/error/page');
    expect(authErrorMeta.title).toContain('Sign-in error');
  });
});
