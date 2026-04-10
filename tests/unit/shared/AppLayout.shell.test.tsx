import fs from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/react';
import React from 'react';
import AppShell from '@/shared/layout/AppShell';
import { AppHeader } from '@/shared/layout/AppHeader';
import { AppNav } from '@/shared/layout/AppNav';
import { BRAND_NAME } from '@/platform/config/brand';

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
  auth0: { getSession: jest.fn() },
  getSessionNormalized: jest.fn(),
  getCachedSessionNormalized: jest.fn(),
}));

const getSessionNormalizedMock = jest.requireMock('@/platform/auth0')
  .getCachedSessionNormalized as jest.Mock;

describe('shared layout shell/header', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders AppHeader with brand and nested nav', () => {
    render(<AppHeader isAuthed />);
    expect(screen.getByText(BRAND_NAME)).toBeInTheDocument();
    expect(screen.queryByText(/Talent Partner Dashboard/)).toBeNull();
    expect(screen.getByRole('banner')).toHaveAttribute(
      'data-winoe-report-no-print',
      'true',
    );
  });

  it('renders AppShell with auth-driven header and children', async () => {
    getSessionNormalizedMock.mockResolvedValue({ user: { sub: 'abc' } });
    const element = await AppShell({ children: <div data-testid="child" /> });
    render(element);
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText(BRAND_NAME)).toBeInTheDocument();
    expect(screen.queryByText(/Talent Partner Dashboard/)).toBeNull();
    expect(screen.getByRole('main')).toHaveAttribute(
      'data-winoe-report-main-content',
      'true',
    );
  });

  it('marks talent_partner navigation as no-print chrome', () => {
    render(
      <AppNav
        isAuthed
        navScope="talent_partner"
        permissions={['talent_partner:access']}
      />,
    );
    expect(screen.getByRole('navigation')).toHaveAttribute(
      'data-winoe-report-no-print',
      'true',
    );
  });

  it('scopes winoe-report print css to shell markers and main content', () => {
    const css = fs.readFileSync(
      path.join(process.cwd(), 'src/app/globals.css'),
      'utf8',
    );
    expect(css).toContain(
      "body.winoe-report-print-mode [data-winoe-report-no-print='true']",
    );
    expect(css).toContain(
      "body.winoe-report-print-mode [data-winoe-report-main-content='true']",
    );
    expect(css).toContain(
      'body.winoe-report-print-mode .winoe-report-print-root',
    );
    expect(css).not.toContain('body.winoe-report-print-mode > div > header');
  });
});
