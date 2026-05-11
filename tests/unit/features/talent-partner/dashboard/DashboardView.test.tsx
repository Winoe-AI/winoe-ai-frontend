import { act, render, screen } from '@testing-library/react';
import { baseProps, resetDashboardViewMocks } from './DashboardView.testlib';
import DashboardView from '@/features/talent-partner/dashboard/TalentPartnerDashboardView';

describe('DashboardView layout states', () => {
  beforeEach(() => {
    resetDashboardViewMocks();
  });

  it('renders trials and header', () => {
    act(() => render(<DashboardView {...baseProps()} />));
    expect(screen.getByText('Trials')).toBeInTheDocument();
    expect(screen.getByText('New Trial')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search trials...')).toBeInTheDocument();
  });

  it('shows loading skeleton', () => {
    const props = baseProps();
    props.trialsLoading = true;
    const view = render(<DashboardView {...props} />);
    expect(view.container.querySelector('.animate-pulse')).toBeTruthy();
  });
});
