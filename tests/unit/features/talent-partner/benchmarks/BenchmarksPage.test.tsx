import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BenchmarksPage from '@/features/talent-partner/benchmarks/BenchmarksPage';

const mockPush = jest.fn();
const mockListTrials = jest.fn();
const mockGetBenchmarks = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('@/features/talent-partner/api', () => ({
  listTrials: (...args: unknown[]) => mockListTrials(...args),
}));

jest.mock('@/features/talent-partner/api/benchmarksApi', () => ({
  getBenchmarks: (...args: unknown[]) => mockGetBenchmarks(...args),
}));

function buildBenchmarksPayload() {
  return {
    cohort: {
      n: 4,
      median: 85,
      mean: 84.5,
      range: [80, 90] as [number, number],
      sufficient: true,
    },
    pagination: {
      page: 1,
      page_size: 25,
      total: 4,
      total_pages: 1,
    },
    candidates: [
      {
        id: 'cand-1',
        name: 'Candidate One',
        email: 'one@example.com',
        trial_id: 'trial-1',
        trial_title: 'Demo Trial',
        report_id: 'report-1',
        winoe_score: 80,
        dimensions: [
          { name: 'Architecture', score: 8 },
          { name: 'Communication', score: 7.5 },
        ],
        status: 'evaluated',
        submitted_at: '2026-05-11T14:00:00.000Z',
      },
      {
        id: 'cand-2',
        name: 'Candidate Two',
        email: 'two@example.com',
        trial_id: 'trial-1',
        trial_title: 'Demo Trial',
        report_id: null,
        winoe_score: null,
        dimensions: [],
        status: 'completed',
        submitted_at: '2026-05-11T15:00:00.000Z',
      },
      {
        id: 'cand-3',
        name: 'Candidate Three',
        email: 'three@example.com',
        trial_id: 'trial-1',
        trial_title: 'Demo Trial',
        report_id: null,
        winoe_score: null,
        dimensions: [],
        status: 'report_pending',
        submitted_at: '2026-05-11T16:00:00.000Z',
      },
      {
        id: 'cand-4',
        name: 'Candidate Four',
        email: 'four@example.com',
        trial_id: 'trial-1',
        trial_title: 'Demo Trial',
        report_id: 'report-4',
        winoe_score: 90,
        dimensions: [
          { name: 'Architecture', score: 9 },
          { name: 'Communication', score: 8.5 },
        ],
        status: 'evaluated',
        submitted_at: '2026-05-11T17:00:00.000Z',
      },
    ],
  };
}

describe('BenchmarksPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListTrials.mockResolvedValue([{ id: 'trial-1', title: 'Demo Trial' }]);
    mockGetBenchmarks.mockResolvedValue(buildBenchmarksPayload());
  });

  it('keeps the top-level route neutral until a Trial is selected', async () => {
    render(<BenchmarksPage />);

    expect(
      await screen.findByText('Select a Trial to view benchmarks'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Cohort summary')).not.toBeInTheDocument();
  });

  it('renders cohort stats, table columns, selection controls, and compare flow', async () => {
    const user = userEvent.setup();
    render(<BenchmarksPage initialTrialId="trial-1" />);

    expect(await screen.findByText('Benchmarks')).toBeInTheDocument();
    expect(
      screen.getByText('Compare candidates evaluated by the same Trial.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Trial')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Time range')).toBeInTheDocument();
    expect(
      screen.getAllByText('Same Trial. Same Winoe instance. Same rubric.')
        .length,
    ).toBeGreaterThan(0);
    expect(screen.getByText('Cohort summary')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('84.5')).toBeInTheDocument();
    expect(screen.getByText('80 - 90')).toBeInTheDocument();
    expect(screen.getByText('Sufficient sample size')).toBeInTheDocument();
    expect(screen.getByText('Candidates')).toBeInTheDocument();
    expect(screen.getByText('Dimension sparklines')).toBeInTheDocument();
    expect(screen.getAllByText('View submission').length).toBeGreaterThan(0);
    expect(screen.getAllByText('View report').length).toBeGreaterThan(0);
    expect(
      screen.queryByText(
        'With fewer than 3 candidates, comparison is informational rather than statistically meaningful.',
      ),
    ).not.toBeInTheDocument();

    await user.click(screen.getByLabelText('Select Candidate Two'));
    expect(mockPush).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', {
        name: /Compare 1 candidates side-by-side/i,
      }),
    ).toBeDisabled();

    await user.click(screen.getByLabelText('Select Candidate One'));
    expect(
      screen.getByRole('button', {
        name: /Compare 2 candidates side-by-side/i,
      }),
    ).toBeEnabled();

    await user.click(screen.getByLabelText('Select Candidate Three'));
    await user.click(screen.getByLabelText('Select Candidate Four'));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'You can compare up to 3 candidates at a time.',
    );

    await user.click(
      screen.getByRole('button', {
        name: /Compare 3 candidates side-by-side/i,
      }),
    );
    expect(mockPush).toHaveBeenCalledWith(
      '/talent-partner/benchmarks/compare?candidates=cand-2%2Ccand-1%2Ccand-3',
    );

    await user.click(screen.getAllByText('Candidate One')[0]);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        '/talent-partner/trials/trial-1/candidates/cand-1/winoe-report',
      );
    });

    const readyRow = screen.getByText('Candidate One').closest('tr');
    expect(readyRow).not.toBeNull();
    expect(
      within(readyRow as HTMLTableRowElement).getByRole('link', {
        name: /View report/i,
      }),
    ).toHaveAttribute(
      'href',
      '/talent-partner/trials/trial-1/candidates/cand-1/winoe-report',
    );

    const pendingRow = screen.getByText('Candidate Three').closest('tr');
    expect(pendingRow).not.toBeNull();
    expect(
      within(pendingRow as HTMLTableRowElement).queryByRole('link', {
        name: /View report/i,
      }),
    ).not.toBeInTheDocument();
  });

  it('shows the limited sample caveat when fewer than three candidates are returned', async () => {
    mockGetBenchmarks.mockResolvedValueOnce({
      cohort: {
        n: 2,
        median: 84,
        mean: 84,
        range: [80, 88] as [number, number],
        sufficient: false,
      },
      pagination: {
        page: 1,
        page_size: 25,
        total: 2,
        total_pages: 1,
      },
      candidates: buildBenchmarksPayload().candidates.slice(0, 2),
    });

    render(<BenchmarksPage initialTrialId="trial-1" />);

    expect(
      await screen.findByText(
        'With fewer than 3 candidates, comparison is informational rather than statistically meaningful.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Limited sample')).toBeInTheDocument();
  });
});
