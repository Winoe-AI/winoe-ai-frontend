import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import {
  listSimulationCandidatesMock,
  primeDetailMocks,
  renderDetailPage,
} from './RecruiterSimulationDetailPage.component.testlib';

describe('RecruiterSimulationDetailPage component interactions', () => {
  beforeEach(() => {
    primeDetailMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('opens invite modal', async () => {
    await renderDetailPage();
    await waitFor(() =>
      expect(screen.getByText(/No candidates yet/i)).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: /Invite candidate/i }));
    expect(await screen.findByTestId('invite-modal')).toBeInTheDocument();
  });

  it('filters candidates by search input', async () => {
    listSimulationCandidatesMock.mockResolvedValue([
      {
        candidateSessionId: 1,
        candidateName: 'Alice',
        inviteEmail: 'alice@test.com',
        inviteUrl: 'http://invite',
      },
      {
        candidateSessionId: 2,
        candidateName: 'Bob',
        inviteEmail: 'bob@test.com',
        inviteUrl: 'http://invite',
      },
    ]);
    await renderDetailPage();
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText(/Search by name/i), {
      target: { value: 'Alice' },
    });
    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    await waitFor(() =>
      expect(screen.queryByText('Bob')).not.toBeInTheDocument(),
    );
  });
});
