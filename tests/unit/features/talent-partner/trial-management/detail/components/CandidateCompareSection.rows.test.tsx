import { render, screen, within } from '@testing-library/react';
import { CandidateCompareSection } from '@/features/talent-partner/trial-management/detail/components/CandidateCompareSection';
import { baseProps, makeRow } from './CandidateCompareSection.testlib';

describe('CandidateCompareSection row rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders completed rows with distinct scores, dimensional summaries, and report links', () => {
    render(
      <CandidateCompareSection
        {...baseProps}
        rows={[
          makeRow({
            candidateSessionId: 'cand-1',
            candidateLabel: 'Candidate One',
            overallWinoeScore: 0.71,
            recommendation: 'lean_hire',
            strengths: ['Clear API communication'],
            risks: ['Needs stronger testing discipline'],
          }),
          makeRow({
            candidateSessionId: 'cand-2',
            candidateLabel: 'Candidate Two',
            overallWinoeScore: 0.84,
            recommendation: 'strong_hire',
            strengths: ['Strong ownership'],
            risks: ['Needs clearer docs'],
          }),
        ]}
        candidateCount={2}
      />,
    );

    expect(
      screen.getByText('Comparing 2 candidates for this Trial'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Limited comparison — results are more meaningful with additional candidates.',
      ),
    ).toBeInTheDocument();

    const rowOne = screen.getByTestId('candidate-compare-row-cand-1');
    const rowTwo = screen.getByTestId('candidate-compare-row-cand-2');

    expect(within(rowOne).getByText('71%')).toBeInTheDocument();
    expect(
      within(rowOne).getByText('Evidence shows meaningful strengths.'),
    ).toBeInTheDocument();
    expect(
      within(rowOne).getByText('Strength: Clear API communication'),
    ).toBeInTheDocument();
    expect(
      within(rowOne).getByText('Risk: Needs stronger testing discipline'),
    ).toBeInTheDocument();

    expect(within(rowTwo).getByText('84%')).toBeInTheDocument();
    expect(
      within(rowTwo).getByText(
        'Evidence suggests strong alignment with this Trial.',
      ),
    ).toBeInTheDocument();
    expect(
      within(rowTwo).getByText('Strength: Strong ownership'),
    ).toBeInTheDocument();
    expect(
      within(rowTwo).getByText('Risk: Needs clearer docs'),
    ).toBeInTheDocument();
    expect(
      within(rowTwo).getByRole('link', { name: /View Winoe Report/i }),
    ).toHaveAttribute(
      'href',
      '/dashboard/trials/trial-1/candidates/cand-2/winoe-report',
    );
    expect(screen.queryByText(/^Hire$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Reject$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Fit Score$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Fit Profile$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/recruiter/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/simulation/i)).not.toBeInTheDocument();
  });
});
