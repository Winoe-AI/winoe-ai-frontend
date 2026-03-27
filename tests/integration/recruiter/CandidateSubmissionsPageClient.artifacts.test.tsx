import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  CandidateSubmissionsPage,
  makeCandidate,
  makeDetail,
  makeListItem,
  resetCandidateSubmissionsClient,
  setClientScenario,
} from './CandidateSubmissionsPageClient.testlib';

describe('CandidateSubmissionsPage client artifacts', () => {
  beforeEach(() => {
    resetCandidateSubmissionsClient();
  });

  it('renders artifacts and opens test output details', async () => {
    const getMock = jest.fn((path: string) => {
      if (path.includes('/simulations/sim-1/candidates')) return [makeCandidate('Dee', 'completed')];
      if (path.includes('/submissions?candidateSessionId=900')) return { items: [makeListItem(1, 2, 'Debug API')] };
      if (path.includes('/submissions/1')) return makeDetail(1, 2, 'Debug API', 'code', 'suite output');
      throw new Error(`Unexpected path ${path}`);
    });
    setClientScenario(getMock);

    const user = userEvent.setup();
    render(<CandidateSubmissionsPage />);
    expect(await screen.findByText(/Dee — Submissions/i)).toBeInTheDocument();
    expect(await screen.findByText(/Latest GitHub artifacts/i)).toBeInTheDocument();
    expect(await screen.findByText(/Day 2: Debug API/i)).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: /View/i })[0]);
    expect(await screen.findByText(/suite output/i)).toBeInTheDocument();
  });

  it('uses string route params for candidate filtering', async () => {
    const getMock = jest.fn((path: string) => {
      if (path.includes('/simulations/sim-1/candidates')) return [makeCandidate('Dee', 'completed')];
      if (path.includes('/submissions?candidateSessionId=900')) return { items: [makeListItem(2, 1, 'First Task', 'design')] };
      if (path.includes('/submissions/2')) return makeDetail(2, 1, 'First Task', 'design');
      throw new Error(`Unexpected path ${path}`);
    });
    setClientScenario(getMock);

    const user = userEvent.setup();
    render(<CandidateSubmissionsPage />);
    await user.click(await screen.findByRole('button', { name: /Show all/i }));
    expect(await screen.findByText(/First Task/i)).toBeInTheDocument();
    expect((getMock.mock.calls as [string][]).map((call) => call[0])).toEqual(
      expect.arrayContaining([
        expect.stringContaining('/simulations/sim-1/candidates'),
        expect.stringContaining('/submissions?candidateSessionId=900'),
        expect.stringContaining('/submissions/2'),
      ]),
    );
  });
});
