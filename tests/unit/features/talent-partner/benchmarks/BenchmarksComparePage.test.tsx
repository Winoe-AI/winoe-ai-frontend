import { render, screen } from '@testing-library/react';
import BenchmarksComparePage from '@/features/talent-partner/benchmarks/BenchmarksComparePage';

const mockGetBenchmarkCompare = jest.fn();
let mockSearchParams = new URLSearchParams('candidates=cand-1,cand-2');

jest.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}));

jest.mock('@/features/talent-partner/api/benchmarksApi', () => ({
  getBenchmarkCompare: (...args: unknown[]) => mockGetBenchmarkCompare(...args),
}));

function buildComparePayload(count: 2 | 3) {
  const base = [
    {
      id: 'cand-1',
      name: 'Candidate One',
      email: 'one@example.com',
      trial_id: 'trial-1',
      trial_title: 'Demo Trial',
      report_id: 'report-1',
      winoe_score: 88,
      dimensions: [
        { name: 'Architecture', score: 8.8 },
        { name: 'Communication', score: 8.1 },
      ],
      status: 'evaluated' as const,
      submitted_at: '2026-05-11T14:00:00.000Z',
      score_ring: 88,
      radar_dimensions: [
        { name: 'Architecture', score: 8.8 },
        { name: 'Communication', score: 8.1 },
      ],
    },
    {
      id: 'cand-2',
      name: 'Candidate Two',
      email: 'two@example.com',
      trial_id: 'trial-1',
      trial_title: 'Demo Trial',
      report_id: 'report-2',
      winoe_score: 82,
      dimensions: [
        { name: 'Architecture', score: 7.9 },
        { name: 'Communication', score: 8.3 },
      ],
      status: 'evaluated' as const,
      submitted_at: '2026-05-11T15:00:00.000Z',
      score_ring: 82,
      radar_dimensions: [
        { name: 'Architecture', score: 7.9 },
        { name: 'Communication', score: 8.3 },
      ],
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
      status: 'report_pending' as const,
      submitted_at: '2026-05-11T16:00:00.000Z',
      score_ring: null,
      radar_dimensions: [],
    },
  ];

  return {
    candidates: base.slice(0, count),
  };
}

describe('BenchmarksComparePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams('candidates=cand-1,cand-2');
    mockGetBenchmarkCompare.mockResolvedValue(buildComparePayload(2));
  });

  it('renders the side-by-side comparison with two candidates', async () => {
    const { getByTestId } = render(<BenchmarksComparePage />);

    expect(
      await screen.findByText('Side-by-side comparison'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Same Trial. Same Winoe instance. Same rubric.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'These candidates are comparable because they completed the same Trial under the same Calibration and were evaluated by the same Winoe instance.',
      ),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Candidate One' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Candidate Two' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('View full report').length).toBeGreaterThan(0);
    expect(screen.getAllByText('View raw submission').length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText('Architecture').length).toBeGreaterThan(0);
    expect(getByTestId('benchmarks-compare-grid')).toHaveClass(
      'xl:grid-cols-2',
    );
    const reportLinks = screen.getAllByRole('link', {
      name: /View full report/i,
    });
    expect(reportLinks[0]).toHaveAttribute(
      'href',
      '/talent-partner/trials/trial-1/candidates/cand-1/winoe-report',
    );
  });

  it('renders three candidates when provided', async () => {
    mockSearchParams = new URLSearchParams('candidates=cand-1,cand-2,cand-3');
    mockGetBenchmarkCompare.mockResolvedValue(buildComparePayload(3));

    const { getByTestId } = render(<BenchmarksComparePage />);

    expect(
      await screen.findByRole('heading', { name: 'Candidate Three' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Candidate One' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Candidate Two' }),
    ).toBeInTheDocument();
    expect(getByTestId('benchmarks-compare-grid')).toHaveClass(
      'xl:grid-cols-3',
    );
    expect(
      screen.getAllByRole('link', { name: /View full report/i }),
    ).toHaveLength(2);
  });

  it('renders mixed-Trial error state from the API', async () => {
    mockGetBenchmarkCompare.mockRejectedValueOnce({
      status: 400,
      message: 'Candidates must belong to the same Trial.',
    });

    render(<BenchmarksComparePage />);

    expect(
      await screen.findByText('Compare request invalid'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Provide 2 or 3 candidate IDs from the same Trial.'),
    ).toBeInTheDocument();
  });
});
