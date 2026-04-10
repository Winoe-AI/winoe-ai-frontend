import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import {
  CandidateSubmissionsPage,
  buildArtifact,
  talentPartnerGetMock,
  resetCandidateSubmissionsExtraMocks,
} from './CandidateSubmissionsPage.extra.testlib';

describe('CandidateSubmissionsPage extra coverage - latest submission', () => {
  beforeEach(resetCandidateSubmissionsExtraMocks);

  it('picks latest submission by timestamp', async () => {
    talentPartnerGetMock.mockImplementation((path: string) => {
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
            {
              submissionId: 2,
              candidateSessionId: 123,
              taskId: 12,
              dayIndex: 2,
              type: 'code',
              submittedAt: '2024-01-02T00:00:00Z',
            },
          ],
        });
      }
      if (path.includes('/2')) {
        return Promise.resolve(
          buildArtifact(2, 2, { contentText: 'Latest submission' }),
        );
      }
      return Promise.resolve(buildArtifact(1, 2));
    });

    await act(async () => render(<CandidateSubmissionsPage />));
    await waitFor(() => {
      expect(screen.getByText(/Latest submission/i)).toBeInTheDocument();
    });
  });
});
