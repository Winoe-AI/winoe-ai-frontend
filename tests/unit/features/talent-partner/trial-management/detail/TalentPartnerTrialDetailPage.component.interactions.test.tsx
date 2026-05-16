import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import {
  listTrialCandidatesMock,
  primeDetailMocks,
  renderDetailPage,
} from './TalentPartnerTrialDetailPage.component.testlib';

describe('TalentPartnerTrialDetailPage component interactions', () => {
  beforeEach(() => {
    primeDetailMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('opens invite modal', async () => {
    await renderDetailPage();
    await waitFor(() =>
      expect(
        screen.getByText(/No candidates invited yet/i),
      ).toBeInTheDocument(),
    );
    const inviteButtons = screen.getAllByRole('button', {
      name: /^Invite candidates$/i,
    });
    const enabled = inviteButtons.find(
      (b) => !(b as HTMLButtonElement).disabled,
    );
    expect(enabled).toBeTruthy();
    fireEvent.click(enabled!);
    expect(
      await screen.findByRole('heading', { name: 'Invite candidates' }),
    ).toBeInTheDocument();
  });

  it('filters candidates by search input', async () => {
    jest.useFakeTimers();
    listTrialCandidatesMock.mockResolvedValue([
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
