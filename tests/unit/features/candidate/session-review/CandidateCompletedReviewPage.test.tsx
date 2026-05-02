import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CandidateCompletedReviewPage from '@/features/candidate/session-review/CandidateCompletedReviewPage';
import { getCandidateCompletedReview } from '@/features/candidate/session/api';

const getCandidateCompletedReviewMock =
  getCandidateCompletedReview as jest.Mock;

const routerMock = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => routerMock,
}));

jest.mock('@/features/candidate/session/api', () => ({
  getCandidateCompletedReview: jest.fn(),
}));

describe('CandidateCompletedReviewPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCandidateCompletedReviewMock.mockReset();
  });

  it('renders the completed review in read-only order with all day artifacts', async () => {
    getCandidateCompletedReviewMock.mockResolvedValue({
      candidateSessionId: 42,
      status: 'completed',
      completedAt: '2025-01-15T10:00:00Z',
      candidateTimezone: 'America/New_York',
      trial: {
        title: 'Infra Trial',
        role: 'Backend Engineer',
        company: 'Winoe',
      },
      dayWindows: [
        {
          dayIndex: 1,
          windowStartAt: '2025-01-10T14:00:00Z',
          windowEndAt: '2025-01-10T22:00:00Z',
        },
      ],
      artifacts: [
        {
          kind: 'workspace',
          dayIndex: 3,
          taskId: 13,
          taskType: 'code',
          title: 'Implementation Wrap-Up',
          submittedAt: '2025-01-13T18:00:00Z',
          repoFullName: 'winoe-ai/infra-trial',
          commitSha: 'def4567',
          cutoffCommitSha: 'abc1234',
          cutoffAt: '2025-01-13T17:45:00Z',
          workflowUrl:
            'https://github.com/winoe-ai/infra-trial/actions/runs/123',
          commitUrl: 'https://github.com/winoe-ai/infra-trial/commit/def4567',
          diffUrl:
            'https://github.com/winoe-ai/infra-trial/compare/abc1234...def4567',
          diffSummary: { changedFiles: 2, additions: 24, deletions: 8 },
          testResults: {
            status: 'passed',
            passed: 12,
            failed: 0,
            total: 12,
            stdout: 'All tests passed.',
            stderr: null,
            runStatus: 'completed',
            conclusion: 'success',
            workflowUrl:
              'https://github.com/winoe-ai/infra-trial/actions/runs/123',
            commitUrl: 'https://github.com/winoe-ai/infra-trial/commit/def4567',
          },
          commitHistory: [
            {
              sha: 'def4567',
              message: 'Wrap up implementation and cleanup',
              authorName: 'Candidate',
              committedAt: '2025-01-13T17:50:00Z',
              url: 'https://github.com/winoe-ai/infra-trial/commit/def4567',
            },
          ],
        },
        {
          kind: 'markdown',
          dayIndex: 1,
          taskId: 11,
          taskType: 'design',
          title: 'Design Doc',
          submittedAt: '2025-01-11T18:00:00Z',
          markdown: '# Architecture\n\n- Goal\n- Risks',
        },
        {
          kind: 'presentation',
          dayIndex: 4,
          taskId: 14,
          taskType: 'handoff',
          title: 'Handoff + Demo',
          submittedAt: '2025-01-14T18:00:00Z',
          recording: {
            recordingId: 'rec_123',
            contentType: 'video/mp4',
            bytes: 1024,
            status: 'ready',
            createdAt: '2025-01-14T17:50:00Z',
            downloadUrl: 'https://cdn.example.com/rec_123.mp4',
          },
          transcript: {
            status: 'ready',
            text: 'Transcript text fallback.',
            segments: [
              {
                startMs: 0,
                endMs: 1000,
                text: 'Hello from the demo.',
              },
            ],
          },
        },
        {
          kind: 'workspace',
          dayIndex: 2,
          taskId: 12,
          taskType: 'code',
          title: 'Implementation Kickoff',
          submittedAt: '2025-01-12T18:00:00Z',
          repoFullName: 'winoe-ai/infra-trial',
          commitSha: 'abc1234',
          cutoffCommitSha: 'abc1234',
          cutoffAt: '2025-01-12T17:45:00Z',
          workflowUrl:
            'https://github.com/winoe-ai/infra-trial/actions/runs/122',
          commitUrl: 'https://github.com/winoe-ai/infra-trial/commit/abc1234',
          testResults: {
            status: 'passed',
            passed: 8,
            failed: 0,
            total: 8,
          },
          commitHistory: [
            {
              sha: 'abc1234',
              message: 'Initialize implementation kickoff work',
              authorName: 'Candidate',
              committedAt: '2025-01-12T17:30:00Z',
              url: 'https://github.com/winoe-ai/infra-trial/commit/abc1234',
            },
          ],
        },
        {
          kind: 'markdown',
          dayIndex: 5,
          taskId: 15,
          taskType: 'documentation',
          title: 'Reflection Essay',
          submittedAt: '2025-01-15T18:00:00Z',
          markdown: '## Reflection\n\nThe Trial was complete.',
        },
      ],
    });

    render(<CandidateCompletedReviewPage token="review-token" />);

    await screen.findByText('Infra Trial');

    expect(screen.getByText('Infra Trial')).toBeInTheDocument();
    expect(screen.getByText('Winoe')).toBeInTheDocument();
    expect(screen.getByText('Jan 15, 2025')).toBeInTheDocument();
    expect(screen.getByText('America/New_York')).toBeInTheDocument();

    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByLabelText(/markdown editor/i)).toBeNull();
    expect(screen.queryByText(/file upload/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /submit/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /save draft/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /run tests/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /preview/i })).toBeNull();
    expect(
      screen.queryByRole('button', { name: /start recording/i }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: /stop recording/i }),
    ).toBeNull();
    expect(screen.queryByRole('button', { name: /record/i })).toBeNull();

    expect(screen.getByText('Day 1 — Design Doc')).toBeInTheDocument();
    expect(
      screen.getByText('Day 2 — Implementation Kickoff'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Day 3 — Implementation Wrap-Up'),
    ).toBeInTheDocument();
    expect(screen.getByText('Day 4 — Handoff + Demo')).toBeInTheDocument();
    expect(screen.getByText('Day 5 — Reflection Essay')).toBeInTheDocument();

    expect(
      screen.getAllByText(/^Day [1-5] —/).map((node) => node.textContent),
    ).toEqual([
      'Day 1 — Design Doc',
      'Day 2 — Implementation Kickoff',
      'Day 3 — Implementation Wrap-Up',
      'Day 4 — Handoff + Demo',
      'Day 5 — Reflection Essay',
    ]);

    expect(
      screen.getByRole('heading', { name: /architecture/i, level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /^Implementation Kickoff$/i,
        level: 2,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /^Implementation Wrap-Up$/i,
        level: 2,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Hello from the demo\./i)).toBeInTheDocument();
    expect(screen.getByText(/0\.0s - 1\.0s/i)).toBeInTheDocument();
    expect(screen.getByText(/The Trial was complete\./i)).toBeInTheDocument();
    expect(screen.getAllByText(/Commit history/i)).toHaveLength(2);
    expect(screen.getAllByText(/Test results/i)).toHaveLength(2);
    expect(
      screen.getByText(/Wrap up implementation and cleanup/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/All tests passed\./i)).toBeInTheDocument();
  });

  it('renders empty states for missing days and partial artifacts', async () => {
    getCandidateCompletedReviewMock.mockResolvedValue({
      candidateSessionId: 42,
      status: 'completed',
      completedAt: '2025-01-15T10:00:00Z',
      candidateTimezone: null,
      trial: {
        title: 'Infra Trial',
        role: 'Backend Engineer',
        company: null,
      },
      artifacts: [
        {
          kind: 'workspace',
          dayIndex: 2,
          taskId: 12,
          taskType: 'code',
          title: 'Implementation Kickoff',
          submittedAt: '2025-01-12T18:00:00Z',
        },
        {
          kind: 'workspace',
          dayIndex: 3,
          taskId: 13,
          taskType: 'code',
          title: 'Implementation Wrap-Up',
          submittedAt: '2025-01-13T18:00:00Z',
          repoFullName: 'winoe-ai/infra-trial',
          commitSha: 'def4567',
          cutoffCommitSha: 'abc1234',
          cutoffAt: '2025-01-13T17:45:00Z',
          workflowUrl:
            'https://github.com/winoe-ai/infra-trial/actions/runs/123',
          commitUrl: 'https://github.com/winoe-ai/infra-trial/commit/def4567',
          diffUrl:
            'https://github.com/winoe-ai/infra-trial/compare/abc1234...def4567',
          commitHistory: [],
        },
        {
          kind: 'presentation',
          dayIndex: 4,
          taskId: 14,
          taskType: 'handoff',
          title: 'Handoff + Demo',
          submittedAt: '2025-01-14T18:00:00Z',
          recording: null,
          transcript: null,
        },
      ],
    });

    render(<CandidateCompletedReviewPage token="review-token" />);

    expect(
      await screen.findByText(
        /No design doc content was captured for this day\./i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /^Implementation Kickoff$/i,
        level: 2,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /^Implementation Wrap-Up$/i,
        level: 2,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Recording playback is unavailable for this submission\./i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Transcript unavailable or still processing\./i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /No reflection essay content was captured for this day\./i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Commit history is unavailable for this day\./i),
    ).toHaveLength(2);
    expect(
      screen.getAllByText(/Test results are unavailable for this day\./i),
    ).toHaveLength(2);
  });

  it('routes incomplete trials to a dedicated not-complete state', async () => {
    getCandidateCompletedReviewMock.mockRejectedValueOnce({ status: 409 });

    render(<CandidateCompletedReviewPage token="review-token" />);

    expect(
      await screen.findByText(/Trial not complete yet/i),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: /Return to active session/i }),
    );
    expect(routerMock.push).toHaveBeenCalledWith(
      '/candidate/session/review-token',
    );
  });

  it('shows an unavailable state for backend failures', async () => {
    getCandidateCompletedReviewMock.mockRejectedValueOnce({ status: 500 });

    render(<CandidateCompletedReviewPage token="review-token" />);

    expect(
      await screen.findByText(/Completed Trial review unavailable/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: /Back to Candidate Dashboard/i }),
    );
    expect(routerMock.push).toHaveBeenCalledWith('/candidate/dashboard');
  });

  it('redirects to candidate login for auth failures', async () => {
    getCandidateCompletedReviewMock.mockRejectedValueOnce({ status: 401 });

    render(<CandidateCompletedReviewPage token="review-token" />);

    await waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalled();
    });
  });
});
