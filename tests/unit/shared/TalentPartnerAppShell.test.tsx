import React from 'react';
import { render, screen } from '@testing-library/react';
import TalentPartnerAppShell from '@/shared/layout/TalentPartnerAppShell';

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

jest.mock('next/navigation', () => ({
  usePathname: () => '/talent-partner/benchmarks',
}));

describe('TalentPartnerAppShell', () => {
  it('uses the canonical Talent Partner benchmarks href', () => {
    render(
      <TalentPartnerAppShell
        organizationName="Workspace"
        userEmail="user@example.com"
      >
        <div>child</div>
      </TalentPartnerAppShell>,
    );

    expect(screen.getByRole('link', { name: /Benchmarks/i })).toHaveAttribute(
      'href',
      '/talent-partner/benchmarks',
    );
    expect(screen.getByRole('link', { name: /Trials/i })).toHaveAttribute(
      'href',
      '/talent-partner/trials',
    );
  });
});
