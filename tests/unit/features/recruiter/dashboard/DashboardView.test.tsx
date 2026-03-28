import { act, render, screen } from '@testing-library/react';
import { baseProps, resetDashboardViewMocks } from './DashboardView.testlib';
import DashboardView from '@/features/recruiter/dashboard/RecruiterDashboardView';

describe('DashboardView layout states', () => {
  beforeEach(() => {
    resetDashboardViewMocks();
  });

  it('renders profile, simulations, and header', () => {
    act(() => render(<DashboardView {...baseProps()} />));
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByTestId('profile-card')).toHaveTextContent('Recruiter');
    expect(screen.getByTestId('simulation-section')).toBeInTheDocument();
  });

  it('shows loading skeleton and profile error states', () => {
    const props = baseProps();
    props.profile = null;
    props.profileLoading = true;
    const view = render(<DashboardView {...props} />);
    expect(view.container.querySelector('.animate-pulse')).toBeTruthy();

    props.profileLoading = false;
    props.error = 'profile failed';
    act(() => render(<DashboardView {...props} />));
    expect(screen.getByText(/profile failed/)).toBeInTheDocument();
  });
});
