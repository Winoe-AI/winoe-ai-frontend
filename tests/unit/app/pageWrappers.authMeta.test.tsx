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
    expect(metadata?.title).toEqual({
      default: 'Winoe AI | Real-work Trials for hiring',
      template: '%s | Winoe AI',
    });
    expect(metadata?.description).toBe(
      'Winoe AI helps Talent Partners reveal the real hire through real-work Trials, Winoe Reports, Winoe Scores, and artifact-backed Evidence Trails.',
    );
    expect(metadata?.manifest).toBe('/manifest.json');
    expect(metadata?.openGraph).toMatchObject({
      title: 'Winoe AI | Real-work Trials for hiring',
      description:
        'Winoe AI helps Talent Partners reveal the real hire through real-work Trials, Winoe Reports, Winoe Scores, and artifact-backed Evidence Trails.',
      siteName: 'Winoe AI',
      type: 'website',
    });
    expect(metadata?.twitter).toMatchObject({
      card: 'summary_large_image',
      title: 'Winoe AI | Real-work Trials for hiring',
      description:
        'Winoe AI helps Talent Partners reveal the real hire through real-work Trials, Winoe Reports, Winoe Scores, and artifact-backed Evidence Trails.',
    });
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

  it('exposes marketing route metadata for the root page', async () => {
    const { metadata: marketingMeta } = await import('@/app/(marketing)/page');
    expect(marketingMeta?.title).toEqual({
      absolute: 'Winoe AI | Real-work Trials for hiring',
    });
    expect(marketingMeta?.description).toBe(
      'Winoe AI helps Talent Partners reveal the real hire through real-work Trials, Winoe Reports, Winoe Scores, and artifact-backed Evidence Trails.',
    );
    expect(marketingMeta?.manifest).toBe('/manifest.json');
    expect(marketingMeta?.openGraph).toMatchObject({
      title: 'Winoe AI | Real-work Trials for hiring',
      description:
        'Winoe AI helps Talent Partners reveal the real hire through real-work Trials, Winoe Reports, Winoe Scores, and artifact-backed Evidence Trails.',
      siteName: 'Winoe AI',
      type: 'website',
    });
    expect(marketingMeta?.twitter).toMatchObject({
      card: 'summary_large_image',
      title: 'Winoe AI | Real-work Trials for hiring',
      description:
        'Winoe AI helps Talent Partners reveal the real hire through real-work Trials, Winoe Reports, Winoe Scores, and artifact-backed Evidence Trails.',
    });
  });
});
