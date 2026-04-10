import { render } from '@testing-library/react';
import CandidateDashboardLoading from '@/app/(candidate)/candidate/dashboard/loading';
import CandidateSessionLoading from '@/app/(candidate)/candidate/session/[token]/loading';
import TalentPartnerDashboardLoading from '@/app/(talent-partner)/dashboard/loading';
import TalentPartnerTrialLoading from '@/app/(talent-partner)/dashboard/trials/[id]/loading';
import TalentPartnerTrialNewLoading from '@/app/(talent-partner)/dashboard/trials/new/loading';

describe('loading components render safely', () => {
  it('renders candidate dashboard loading skeleton', () => {
    const { container } = render(<CandidateDashboardLoading />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders candidate session loading skeleton', () => {
    const { container } = render(<CandidateSessionLoading />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders talent partner dashboard loading skeleton', () => {
    const { container } = render(<TalentPartnerDashboardLoading />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders talent_partner trial detail loading skeleton', () => {
    const { container } = render(<TalentPartnerTrialLoading />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders talent_partner trial new loading skeleton', () => {
    const { container } = render(<TalentPartnerTrialNewLoading />);
    expect(container.firstChild).toBeTruthy();
  });
});
