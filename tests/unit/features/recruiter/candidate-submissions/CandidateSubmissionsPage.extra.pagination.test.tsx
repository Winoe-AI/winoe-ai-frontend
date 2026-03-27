import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import {
  CandidateSubmissionsPage,
  buildArtifact,
  recruiterGetMock,
  resetCandidateSubmissionsExtraMocks,
} from './CandidateSubmissionsPage.extra.testlib';

describe('CandidateSubmissionsPage extra coverage - pagination', () => {
  beforeEach(resetCandidateSubmissionsExtraMocks);

  it('displays candidate name in header when available', async () => {
    recruiterGetMock.mockResolvedValue({ items: [] });
    await act(async () => render(<CandidateSubmissionsPage />));
    await waitFor(() => {
      expect(screen.getByText(/Test User/)).toBeInTheDocument();
    });
  });

  it('displays missing Day 2/3 artifacts with unavailable message', async () => {
    recruiterGetMock.mockImplementation((path: string) => {
      if (path.startsWith('/submissions?')) {
        return Promise.resolve({
          items: [
            {
              submissionId: 1,
              candidateSessionId: 123,
              taskId: 11,
              dayIndex: 2,
              type: 'code',
              submittedAt: '2024-01-01T00:00:00Z',
            },
          ],
        });
      }
      return Promise.reject(new Error('Artifact not found'));
    });
    await act(async () => render(<CandidateSubmissionsPage />));
    await waitFor(() => {
      expect(screen.getByText(/details unavailable/i)).toBeInTheDocument();
    });
  });

  it('handles pagination in show all mode', async () => {
    const submissions = Array.from({ length: 12 }, (_, i) => ({
      submissionId: i + 1,
      candidateSessionId: 123,
      taskId: 10 + i,
      dayIndex: (i % 5) + 1,
      type: 'code',
      submittedAt: new Date(2024, 0, i + 1).toISOString(),
    }));
    recruiterGetMock.mockImplementation((path: string) => {
      if (path.startsWith('/submissions?')) return Promise.resolve({ items: submissions });
      const match = path.match(/\/submissions\/(\d+)/);
      if (match) return Promise.resolve(buildArtifact(parseInt(match[1], 10), 2));
      return Promise.resolve({});
    });

    await act(async () => render(<CandidateSubmissionsPage />));
    await waitFor(() => expect(screen.getByText(/Latest GitHub artifacts/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Show all/i }));
    await waitFor(() => expect(screen.getByText(/Page 1/)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    await waitFor(() => expect(screen.getByText(/Page 2/)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Previous/i }));
    await waitFor(() => expect(screen.getByText(/Page 1/)).toBeInTheDocument());
  });
});
