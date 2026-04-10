import { render, screen } from '@testing-library/react';
import DashboardView from '@/features/talent-partner/dashboard/TalentPartnerDashboardView';
import {
  baseProps,
  resetDashboardExtraMocks,
} from './DashboardView.extra.testlib';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('DashboardView extra render states', () => {
  beforeEach(() => {
    resetDashboardExtraMocks();
  });

  it('renders error state when profile load fails', () => {
    const props = baseProps();
    render(<DashboardView {...props} profile={null} error="Boom" />);
    expect(screen.getByText('Boom')).toBeInTheDocument();
  });

  it('renders profile loading skeleton when profileLoading is true', () => {
    const props = baseProps();
    const { container } = render(
      <DashboardView {...props} profile={null} profileLoading />,
    );
    expect(container.querySelector('.animate-pulse')).not.toBeNull();
  });

  it('renders dynamic modal loading content', () => {
    const loadingFn = () => (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
        <div className="rounded bg-white px-4 py-3 text-sm text-gray-700 shadow">
          Loading invite form…
        </div>
      </div>
    );
    render(loadingFn());
    expect(screen.getByText(/Loading invite form/)).toBeInTheDocument();
  });
});
