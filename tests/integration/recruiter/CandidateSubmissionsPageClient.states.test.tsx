import { render, screen } from '@testing-library/react';
import {
  CandidateSubmissionsPage,
  makeCandidate,
  resetCandidateSubmissionsClient,
  setClientScenario,
} from './CandidateSubmissionsPageClient.testlib';

describe('CandidateSubmissionsPage client states', () => {
  beforeEach(() => {
    resetCandidateSubmissionsClient();
  });

  it('shows empty state when no submissions exist', async () => {
    setClientScenario((path: string) => {
      if (path.includes('/simulations/sim-1/candidates'))
        return [makeCandidate('Empty', 'not_started', false)];
      if (path.includes('/submissions?candidateSessionId=900'))
        return { items: [] };
      throw new Error(`Unexpected path ${path}`);
    });

    render(<CandidateSubmissionsPage />);
    expect(await screen.findByText(/No submissions yet/i)).toBeInTheDocument();
  });

  it('surfaces submissions list errors', async () => {
    setClientScenario((path: string) => {
      if (path.includes('/simulations/sim-1/candidates'))
        return [makeCandidate('Err', 'completed', false)];
      if (path.includes('/submissions?candidateSessionId=900'))
        return Promise.reject(new Error('network rejection'));
      throw new Error(`Unexpected path ${path}`);
    });

    render(<CandidateSubmissionsPage />);
    expect(await screen.findByText(/network rejection/i)).toBeInTheDocument();
  });
});
