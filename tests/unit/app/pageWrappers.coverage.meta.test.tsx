import React from 'react';
import { resetPageWrapperMocks } from './pageWrappers.testlib';

describe('page wrapper metadata + layouts', () => {
  beforeEach(() => {
    resetPageWrapperMocks();
  });

  it('auth and not-authorized routes expose metadata', async () => {
    const { metadata: authErrorMeta } =
      await import('@/app/(auth)/auth/error/page');
    expect(authErrorMeta?.title).toBeDefined();

    const { metadata: notAuthorizedMeta } =
      await import('@/app/(auth)/not-authorized/page');
    expect(notAuthorizedMeta).toBeDefined();
  });

  it('not-authorized layout renders', async () => {
    const { default: NotAuthorizedLayout } =
      await import('@/app/(auth)/not-authorized/layout');
    const layout = NotAuthorizedLayout({ children: <div>test</div> });
    expect(React.isValidElement(layout)).toBe(true);
  });

  it('imports auth, candidate, recruiter, and marketing layouts', async () => {
    const { default: AuthLayout } = await import('@/app/(auth)/layout');
    expect(
      React.isValidElement(AuthLayout({ children: <div>test</div> })),
    ).toBe(true);

    const { default: CandidateLayout } =
      await import('@/app/(candidate)/layout');
    expect(
      React.isValidElement(CandidateLayout({ children: <div>test</div> })),
    ).toBe(true);

    const { default: RecruiterLayout } =
      await import('@/app/(recruiter)/layout');
    expect(
      React.isValidElement(RecruiterLayout({ children: <div>test</div> })),
    ).toBe(true);

    const { default: MarketingLayout } =
      await import('@/app/(marketing)/layout');
    expect(
      React.isValidElement(MarketingLayout({ children: <div>test</div> })),
    ).toBe(true);
  });
});
