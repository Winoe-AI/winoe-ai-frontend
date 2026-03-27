import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import {
  listSimulationCandidatesMock,
  recruiterGetMock,
  resetCandidateSubmissionsMocks,
  useParamsMock,
} from './CandidateSubmissionsPage.testlib';
import CandidateSubmissionsPage from '@/features/recruiter/submission-review/CandidateSubmissionsPage';

describe('CandidateSubmissionsPage core flows', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    resetCandidateSubmissionsMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('shows error for invalid candidate id', async () => {
    useParamsMock.mockReturnValue({ id: 'sim-1', candidateSessionId: 'bad' });
    await act(async () => render(<CandidateSubmissionsPage />));
    expect(
      await screen.findByText(/Invalid candidate id/i),
    ).toBeInTheDocument();
  });

  it('shows candidate not found error', async () => {
    listSimulationCandidatesMock.mockResolvedValueOnce([]);
    await act(async () => render(<CandidateSubmissionsPage />));
    expect(await screen.findByText(/Candidate not found/i)).toBeInTheDocument();
  });

  it('renders submissions, latest artifacts, and toggles show-all list', async () => {
    await act(async () => render(<CandidateSubmissionsPage />));
    await waitFor(() =>
      expect(screen.getByText(/Latest GitHub artifacts/i)).toBeInTheDocument(),
    );
    expect(screen.getAllByText(/Day 2|Day 3/).length).toBeGreaterThan(0);

    fireEvent.click(await screen.findByRole('button', { name: /Show all/i }));
    await waitFor(() => expect(screen.getByText(/Page 1/)).toBeInTheDocument());
    expect(recruiterGetMock).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Hide list/i }));
    expect(screen.getByText(/Submission list collapsed/i)).toBeInTheDocument();
  });
});
