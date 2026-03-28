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
      if (path.includes('/simulations/sim-1/candidates'))
        return [makeCandidate('Dee', 'completed')];
      if (path.includes('/submissions?candidateSessionId=900'))
        return { items: [makeListItem(1, 2, 'Debug API')] };
      if (path.includes('/submissions/1'))
        return makeDetail(1, 2, 'Debug API', 'code', 'suite output');
      throw new Error(`Unexpected path ${path}`);
    });
    setClientScenario(getMock);

    const user = userEvent.setup();
    render(<CandidateSubmissionsPage />);
    expect(await screen.findByText(/Dee — Submissions/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/Latest GitHub artifacts/i),
    ).toBeInTheDocument();
    expect(await screen.findByText(/Day 2: Debug API/i)).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: /View/i })[0]);
    expect(await screen.findByText(/suite output/i)).toBeInTheDocument();
  });

  it('uses string route params for candidate filtering', async () => {
    const getMock = jest.fn((path: string) => {
      if (path.includes('/simulations/sim-1/candidates'))
        return [makeCandidate('Dee', 'completed')];
      if (path.includes('/submissions?candidateSessionId=900'))
        return { items: [makeListItem(2, 1, 'First Task', 'design')] };
      if (path.includes('/submissions/2'))
        return makeDetail(2, 1, 'First Task', 'design');
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

  it('renders partial artifact warning when some detail requests fail', async () => {
    const getMock = jest.fn((path: string) => {
      if (path.includes('/simulations/sim-1/candidates'))
        return [makeCandidate('Dee', 'completed')];
      if (path.includes('/submissions?candidateSessionId=900'))
        return {
          items: [
            makeListItem(10, 2, 'Debug API'),
            makeListItem(11, 3, 'Fix pipeline'),
          ],
        };
      if (path.includes('/submissions/10'))
        return makeDetail(10, 2, 'Debug API', 'code', 'stdout ok');
      if (path.includes('/submissions/11'))
        return Promise.reject(new Error('artifact unavailable'));
      throw new Error(`Unexpected path ${path}`);
    });

    setClientScenario(getMock);

    render(<CandidateSubmissionsPage />);

    expect(
      await screen.findByText(/Some submission details are unavailable\./i),
    ).toBeInTheDocument();
    expect(await screen.findByText(/Day 2: Debug API/i)).toBeInTheDocument();
  });
});
