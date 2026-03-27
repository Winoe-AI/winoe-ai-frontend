import { fireEvent, screen, waitFor } from '@testing-library/react';
import {
  listSimulationCandidatesMock,
  primeDetailMocks,
  renderDetailPage,
} from './RecruiterSimulationDetailPage.component.testlib';

describe('RecruiterSimulationDetailPage pagination and retry', () => {
  beforeEach(() => {
    primeDetailMocks();
  });

  it('supports candidate pagination controls', async () => {
    const candidates = Array.from({ length: 30 }).map((_, idx) => ({
      candidateSessionId: idx + 1,
      candidateName: `Candidate ${idx + 1}`,
      inviteEmail: `c${idx + 1}@test.com`,
      inviteUrl: 'http://invite/link',
    }));
    listSimulationCandidatesMock.mockResolvedValue(candidates);
    await renderDetailPage();

    fireEvent.click(await screen.findByRole('button', { name: /^Next$/i }));
    await waitFor(() =>
      expect(screen.getByText(/Page 2 \/ 2/)).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: /^Prev$/i }));
    expect(screen.getByText(/Page 1 \/ 2/)).toBeInTheDocument();
  });

  it('retries candidate loading after a failed fetch', async () => {
    listSimulationCandidatesMock
      .mockRejectedValueOnce({ status: 500, details: 'boom' })
      .mockResolvedValueOnce([
        {
          candidateSessionId: 33,
          candidateName: 'Retry Ok',
          inviteEmail: 'retry@test.com',
          inviteUrl: 'http://invite/retry',
        },
      ]);
    await renderDetailPage();
    fireEvent.click(await screen.findByRole('button', { name: /^Retry$/i }));
    await waitFor(() =>
      expect(screen.getByText('Retry Ok')).toBeInTheDocument(),
    );
  });
});
