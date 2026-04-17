import React from 'react';
import { render, screen } from '@testing-library/react';
import { TrialListRow } from '@/features/talent-partner/trial-management/list/TrialListRow';
import type { TrialListItem } from '@/features/talent-partner/api';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('TrialListRow', () => {
  const baseTrial: TrialListItem = {
    id: 'trial-1',
    title: 'Backend Trial',
    role: 'Backend Engineer',
    createdAt: '2026-03-16T00:00:00Z',
    candidateCount: 0,
    status: 'active_inviting',
  };

  it('renders normalized candidate counts and lifecycle status without template copy', () => {
    render(
      <TrialListRow
        trial={baseTrial}
        onInvite={jest.fn()}
        onPrefetch={jest.fn()}
      />,
    );

    expect(
      screen.getByRole('link', { name: 'Backend Trial' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
    expect(screen.getByText('2026-03-16')).toBeInTheDocument();
    expect(screen.getByText('0 candidate(s)')).toBeInTheDocument();
    expect(screen.getByText('Active inviting')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Invite candidate/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Template:/i)).toBeNull();
  });

  it('renders non-zero candidate counts directly', () => {
    render(
      <TrialListRow
        trial={{ ...baseTrial, candidateCount: 3 }}
        onInvite={jest.fn()}
        onPrefetch={jest.fn()}
      />,
    );

    expect(screen.getByText('3 candidate(s)')).toBeInTheDocument();
  });
});
