import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import {
  copyInviteLinkMock,
  listSimulationCandidatesMock,
  notifyMock,
  primeDetailMocks,
  renderDetailPage,
} from './RecruiterSimulationDetailPage.component.testlib';

describe('RecruiterSimulationDetailPage copy and resend flows', () => {
  beforeEach(() => {
    primeDetailMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows manual copy error when invite link is missing', async () => {
    listSimulationCandidatesMock.mockResolvedValue([{ candidateSessionId: 10, candidateName: 'NoLink', inviteEmail: 'no@t.co' }]);
    await renderDetailPage();
    fireEvent.click(await screen.findByRole('button', { name: /Copy invite link/i }));
    expect(await screen.findByText(/Invite link unavailable/i)).toBeInTheDocument();
  });

  it('handles failed copy then closes manual copy drawer', async () => {
    copyInviteLinkMock.mockResolvedValue(false);
    listSimulationCandidatesMock.mockResolvedValue([
      { candidateSessionId: 11, candidateName: 'Copy Fail', inviteEmail: 'copy@fail.com', inviteUrl: 'http://invite/fail' },
    ]);
    await renderDetailPage();
    fireEvent.click(await screen.findByRole('button', { name: /Copy invite link/i }));
    const manualInput = await screen.findByLabelText(/Manual invite link/i);
    expect((manualInput as HTMLInputElement).value).toBe('http://invite/fail');
    fireEvent.click(screen.getByRole('button', { name: /Close/i }));
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
  });

  it('shows row error and notification when resend invite fails', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error('resend failed'));
    listSimulationCandidatesMock.mockResolvedValue([{ candidateSessionId: 22, candidateName: 'Resend', inviteEmail: 'resend@test.com', inviteUrl: 'http://invite/resend' }]);
    await renderDetailPage();
    const row = await screen.findByTestId('candidate-row-22');
    await act(async () => {
      fireEvent.click(within(row).getByRole('button', { name: /Resend invite/i }));
      await Promise.resolve();
    });
    await waitFor(() => expect(within(row).getByText(/resend failed/i)).toBeInTheDocument());
    expect(notifyMock).toHaveBeenCalled();
    global.fetch = originalFetch;
  });
});
