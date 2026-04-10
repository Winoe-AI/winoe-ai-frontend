import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import {
  buildArtifact,
  listTrialCandidatesMock,
  talentPartnerGetMock,
  resetCandidateSubmissionsMocks,
} from './CandidateSubmissionsPage.testlib';
import CandidateSubmissionsPage from '@/features/talent-partner/submission-review/CandidateSubmissionsPage';

describe('CandidateSubmissionsPage refresh + partial data', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    resetCandidateSubmissionsMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('handles empty submissions and refresh', async () => {
    talentPartnerGetMock.mockImplementationOnce((path: string) =>
      path.startsWith('/submissions?')
        ? Promise.resolve({ items: [] })
        : Promise.resolve({}),
    );
    await act(async () => render(<CandidateSubmissionsPage />));
    expect(await screen.findByText(/No submissions yet/i)).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: /reload-submissions/i }),
    );
  });

  it('uses cache-aware candidate verification on mount and bypasses cache on refresh', async () => {
    await act(async () => render(<CandidateSubmissionsPage />));
    await waitFor(() =>
      expect(screen.getByText(/Latest GitHub artifacts/i)).toBeInTheDocument(),
    );

    const firstOpts = listTrialCandidatesMock.mock.calls[0]?.[1] as
      | { skipCache?: boolean }
      | undefined;
    expect(firstOpts?.skipCache).toBe(false);

    fireEvent.click(
      screen.getByRole('button', { name: /reload-submissions/i }),
    );
    await waitFor(() =>
      expect(listTrialCandidatesMock.mock.calls.length).toBeGreaterThan(1),
    );
    const refreshOpts = listTrialCandidatesMock.mock.calls.at(-1)?.[1] as
      | { skipCache?: boolean }
      | undefined;
    expect(refreshOpts?.skipCache).toBe(true);
  });

  it('shows partial artifact warning while rendering available artifacts', async () => {
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
              dayIndex: 3,
              type: 'code',
              submittedAt: '2024-01-02T00:00:00Z',
            },
          ],
        });
      }
      if (path.startsWith('/submissions/1'))
        return Promise.resolve(buildArtifact(1, 2));
      if (path.startsWith('/submissions/2'))
        return Promise.reject(new Error('Artifact unavailable'));
      return Promise.resolve({});
    });

    await act(async () => render(<CandidateSubmissionsPage />));
    expect(
      await screen.findByText(/Some submission details are unavailable/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Day 2: Task 1/i)).toBeInTheDocument();
  });
});
