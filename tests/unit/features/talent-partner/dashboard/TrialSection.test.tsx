import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrialSection } from '@/features/talent-partner/dashboard/components/TrialSection';

type Trial = { id: string; title: string; status: string };

jest.mock(
  '@/features/talent-partner/trial-management/list/TalentPartnerTrialList',
  () => ({
    TalentPartnerTrialList: ({
      trials,
      onInvite,
    }: {
      trials: Trial[];
      onInvite: (sim: Trial) => void;
    }) => (
      <div data-testid="trial-list" onClick={() => onInvite(trials[0])}>
        list-{trials.length}
      </div>
    ),
  }),
);

const sample: Trial[] = [{ id: '1', title: 'Sim 1', status: 'Draft' }];

describe('TrialSection', () => {
  it('renders loading skeleton when loading with no data', () => {
    const { container } = render(
      <TrialSection trials={[]} loading error={null} onInvite={jest.fn()} />,
    );
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('shows error with retry', () => {
    const onRetry = jest.fn();
    render(
      <TrialSection
        trials={[]}
        loading={false}
        error="boom"
        onInvite={jest.fn()}
        onRetry={onRetry}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));
    expect(onRetry).toHaveBeenCalled();
  });
  it('shows list when trials present and handles invite click', () => {
    const onInvite = jest.fn();
    render(
      <TrialSection
        trials={sample}
        loading={false}
        error={null}
        onInvite={onInvite}
      />,
    );
    fireEvent.click(screen.getByTestId('trial-list'));
    expect(onInvite).toHaveBeenCalledWith(sample[0]);
    expect(screen.queryByText(/Refreshing/i)).not.toBeInTheDocument();
  });
  it('shows empty list placeholder when no sims and no error', () => {
    const { container } = render(
      <TrialSection
        trials={[]}
        loading={false}
        error={null}
        onInvite={jest.fn()}
      />,
    );
    expect(
      container.querySelector('[data-testid=\"trial-list\"]'),
    ).toBeTruthy();
  });
  it('shows refreshing label when loading with existing sims', () => {
    render(
      <TrialSection
        trials={sample}
        loading
        error={null}
        onInvite={jest.fn()}
      />,
    );
    expect(screen.getByText(/Refreshing/)).toBeInTheDocument();
  });
  it('omits retry button when onRetry is undefined', () => {
    render(
      <TrialSection
        trials={[]}
        loading={false}
        error="boom"
        onInvite={jest.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: /Retry/i })).toBeNull();
  });
});
