import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  buildSessionContext,
  getHandoffStatusMock,
  resetHandoffRecoveryMocks,
  useCandidateSessionMock,
} from './CandidateSessionPage.handoffRecovery.testlib';
import CandidateSessionPage from '@/features/candidate/session/CandidateSessionPage';

describe('CandidateSessionPage Day 4 handoff current task', () => {
  beforeEach(() => {
    resetHandoffRecoveryMocks();
  });

  it('renders Day 4 handoff panel with preview and transcript from canonical task', async () => {
    useCandidateSessionMock.mockReturnValue(
      buildSessionContext(-30 * 60 * 1000, 30 * 60 * 1000),
    );
    const { container } = render(<CandidateSessionPage token="inv" />);

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /replace upload/i }),
      ).toBeInTheDocument(),
    );
    expect(getHandoffStatusMock).toHaveBeenCalledWith({
      taskId: 44,
      candidateSessionId: 99,
    });
    expect(screen.getAllByText(/day 4 handoff/i).length).toBeGreaterThan(0);
    expect(
      screen.getByRole('button', { name: /replace upload/i }),
    ).toBeDisabled();
    expect(
      screen.getByText(/Upload is disabled until consent is confirmed\./i),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByLabelText(/I consent to submission and processing/i),
    );
    expect(
      screen.getByRole('button', { name: /replace upload/i }),
    ).toBeEnabled();
    expect(screen.getByText(/recovered transcript body/i)).toBeInTheDocument();
    expect(screen.getByText(/00:01 - 00:03/i)).toBeInTheDocument();
    expect(screen.getByText(/recovered segment line/i)).toBeInTheDocument();
    expect(container.querySelector('video')?.getAttribute('src')).toBe(
      'https://cdn.example.com/rec_44.mp4',
    );
  });

  it('disables replace after Day 4 cutoff while still showing preview and transcript', async () => {
    useCandidateSessionMock.mockReturnValue(
      buildSessionContext(-180 * 60 * 1000, -120 * 60 * 1000),
    );
    const { container } = render(<CandidateSessionPage token="inv" />);

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /replace upload/i }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByRole('button', { name: /replace upload/i }),
    ).toBeDisabled();
    expect(screen.getByText(/recovered transcript body/i)).toBeInTheDocument();
    expect(screen.getByText(/recovered segment line/i)).toBeInTheDocument();
    expect(container.querySelector('video')).toBeInTheDocument();
  });
});
