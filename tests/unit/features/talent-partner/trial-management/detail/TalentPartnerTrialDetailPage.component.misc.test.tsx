import { act, screen, waitFor } from '@testing-library/react';
import {
  listTrialCandidatesMock,
  primeDetailMocks,
  talentPartnerGetMock,
  TalentPartnerTrialDetailPage,
  renderDetailPage,
} from './TalentPartnerTrialDetailPage.component.testlib';
import { render } from '@testing-library/react';

describe('TalentPartnerTrialDetailPage miscellaneous states', () => {
  beforeEach(() => {
    primeDetailMocks();
  });

  it('renders days without generated tasks', async () => {
    talentPartnerGetMock.mockResolvedValue({
      title: 'Test',
      days: [{ dayIndex: 1, title: 'Day 1' }],
    });
    await renderDetailPage();
    await waitFor(() =>
      expect(screen.getAllByText(/Not generated yet/).length).toBeGreaterThan(
        0,
      ),
    );
  });

  it('cleans up timers on unmount', async () => {
    listTrialCandidatesMock.mockResolvedValue([
      {
        candidateSessionId: 1,
        inviteEmail: 'a@test.com',
        inviteUrl: 'http://x',
      },
    ]);
    const { unmount } = render(<TalentPartnerTrialDetailPage />);
    await waitFor(() =>
      expect(screen.getByText(/Trial ID/)).toBeInTheDocument(),
    );
    act(() => {
      unmount();
    });
  });
});
