import { act, screen, waitFor } from '@testing-library/react';
import {
  listSimulationCandidatesMock,
  primeDetailMocks,
  recruiterGetMock,
  RecruiterSimulationDetailPage,
  renderDetailPage,
} from './RecruiterSimulationDetailPage.component.testlib';
import { render } from '@testing-library/react';

describe('RecruiterSimulationDetailPage miscellaneous states', () => {
  beforeEach(() => {
    primeDetailMocks();
  });

  it('renders days without generated tasks', async () => {
    recruiterGetMock.mockResolvedValue({
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
    listSimulationCandidatesMock.mockResolvedValue([
      {
        candidateSessionId: 1,
        inviteEmail: 'a@test.com',
        inviteUrl: 'http://x',
      },
    ]);
    const { unmount } = render(<RecruiterSimulationDetailPage />);
    await waitFor(() =>
      expect(screen.getByText(/Simulation ID/)).toBeInTheDocument(),
    );
    act(() => {
      unmount();
    });
  });
});
