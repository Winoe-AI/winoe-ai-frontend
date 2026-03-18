import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CandidateCompareSection } from '@/features/recruiter/simulations/detail/components/CandidateCompareSection';
import type { CandidateCompareRow } from '@/features/recruiter/api';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const makeRow = (
  overrides: Partial<CandidateCompareRow> & { candidateSessionId: string },
): CandidateCompareRow => ({
  candidateSessionId: overrides.candidateSessionId,
  candidateName: overrides.candidateName ?? null,
  candidateEmail: overrides.candidateEmail ?? null,
  candidateLabel: overrides.candidateLabel ?? overrides.candidateSessionId,
  status: overrides.status ?? 'completed',
  fitProfileStatus: overrides.fitProfileStatus ?? 'ready',
  overallFitScore: overrides.overallFitScore ?? 0.8,
  recommendation: overrides.recommendation ?? 'hire',
  updatedAt: overrides.updatedAt ?? '2026-03-16T00:00:00Z',
  strengths: overrides.strengths ?? [],
  risks: overrides.risks ?? [],
  dayCompletion: overrides.dayCompletion ?? [],
});

const baseProps = {
  simulationId: 'sim-1',
  candidateCount: 2,
  candidatesLoading: false,
  compareLoading: false,
  compareError: null,
  rows: [] as CandidateCompareRow[],
  generatingIds: {} as Record<string, boolean>,
  onRetry: jest.fn(),
  onGenerate: jest.fn(),
};

describe('CandidateCompareSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading skeleton while candidates are loading', () => {
    render(
      <CandidateCompareSection
        {...baseProps}
        candidatesLoading
        candidateCount={2}
      />,
    );

    expect(screen.getByText('Compare candidates')).toBeInTheDocument();
    expect(
      document.querySelectorAll('[aria-hidden="true"]').length,
    ).toBeGreaterThan(0);
  });

  it('renders empty state when there are no candidates', () => {
    render(
      <CandidateCompareSection {...baseProps} candidateCount={0} rows={[]} />,
    );

    expect(screen.getByText('No comparison data yet')).toBeInTheDocument();
  });

  it('renders partial rows with score fallback and generate button', async () => {
    const user = userEvent.setup();
    const onGenerate = jest.fn();

    render(
      <CandidateCompareSection
        {...baseProps}
        onGenerate={onGenerate}
        rows={[
          makeRow({
            candidateSessionId: 'cand-2',
            candidateLabel: 'Candidate Two',
            fitProfileStatus: 'not_generated',
            overallFitScore: null,
            recommendation: null,
          }),
        ]}
        candidateCount={1}
      />,
    );

    const row = screen.getByTestId('candidate-compare-row-cand-2');
    expect(within(row).getByText('—')).toBeInTheDocument();

    const generateButton = within(row).getByRole('button', {
      name: /Generate Fit Profile/i,
    });
    expect(generateButton).toBeEnabled();
    await user.click(generateButton);

    expect(onGenerate).toHaveBeenCalledWith('cand-2');
  });

  it('disables generate button while fit profile is generating', () => {
    render(
      <CandidateCompareSection
        {...baseProps}
        rows={[
          makeRow({
            candidateSessionId: 'cand-4',
            candidateLabel: 'Candidate Four',
            fitProfileStatus: 'generating',
            overallFitScore: null,
            recommendation: null,
          }),
        ]}
        candidateCount={1}
      />,
    );

    const row = screen.getByTestId('candidate-compare-row-cand-4');
    expect(
      within(row).getByRole('button', { name: /Generating Fit Profile/i }),
    ).toBeDisabled();
  });

  it('renders ready rows with score, recommendation, and links', () => {
    render(
      <CandidateCompareSection
        {...baseProps}
        rows={[
          makeRow({
            candidateSessionId: 'cand-9',
            candidateLabel: 'Candidate Nine',
            overallFitScore: 0.84,
            recommendation: 'hire',
            strengths: ['Clear API communication'],
            risks: ['Small testing gaps'],
          }),
        ]}
        candidateCount={1}
      />,
    );

    const row = screen.getByTestId('candidate-compare-row-cand-9');
    expect(within(row).getByText('84%')).toBeInTheDocument();
    expect(within(row).getByText('Hire')).toBeInTheDocument();
    expect(
      within(row).getByText('Strength: Clear API communication'),
    ).toBeInTheDocument();
    expect(
      within(row).getByText('Risk: Small testing gaps'),
    ).toBeInTheDocument();

    expect(
      within(row).getByRole('link', { name: /View Submissions/i }),
    ).toHaveAttribute('href', '/dashboard/simulations/sim-1/candidates/cand-9');
    expect(
      within(row).getByRole('link', { name: /View Fit Profile/i }),
    ).toHaveAttribute(
      'href',
      '/dashboard/simulations/sim-1/candidates/cand-9/fit-profile',
    );
  });

  it('renders compare error state with retry', async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();

    render(
      <CandidateCompareSection
        {...baseProps}
        onRetry={onRetry}
        compareError="Unable to load candidate comparison."
        candidateCount={2}
      />,
    );

    expect(
      screen.getByText('Unable to load candidate comparison.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('sorts rows by default rank, then supports candidate sorting', async () => {
    const user = userEvent.setup();

    render(
      <CandidateCompareSection
        {...baseProps}
        rows={[
          makeRow({
            candidateSessionId: 'c-b',
            candidateLabel: 'Beta',
            fitProfileStatus: 'not_generated',
            overallFitScore: null,
            recommendation: null,
          }),
          makeRow({
            candidateSessionId: 'c-a',
            candidateLabel: 'Alpha',
            fitProfileStatus: 'ready',
            overallFitScore: 0.7,
            updatedAt: '2026-03-14T00:00:00Z',
          }),
          makeRow({
            candidateSessionId: 'c-z',
            candidateLabel: 'Zed',
            fitProfileStatus: 'ready',
            overallFitScore: 0.9,
            updatedAt: '2026-03-16T00:00:00Z',
          }),
        ]}
        candidateCount={3}
      />,
    );

    const order = () =>
      screen
        .getAllByTestId(/candidate-compare-row-/)
        .map((row) => row.getAttribute('data-testid'));

    expect(order()).toEqual([
      'candidate-compare-row-c-z',
      'candidate-compare-row-c-a',
      'candidate-compare-row-c-b',
    ]);

    await user.click(screen.getByRole('button', { name: /Candidate/i }));
    expect(order()).toEqual([
      'candidate-compare-row-c-a',
      'candidate-compare-row-c-b',
      'candidate-compare-row-c-z',
    ]);

    await user.click(screen.getByRole('button', { name: /Candidate/i }));
    expect(order()).toEqual([
      'candidate-compare-row-c-z',
      'candidate-compare-row-c-b',
      'candidate-compare-row-c-a',
    ]);
  });

  it('applies aria-sort semantics on sortable headers', async () => {
    const user = userEvent.setup();

    render(
      <CandidateCompareSection
        {...baseProps}
        rows={[
          makeRow({
            candidateSessionId: 'cand-1',
            candidateLabel: 'Alpha',
            overallFitScore: 0.7,
          }),
          makeRow({
            candidateSessionId: 'cand-2',
            candidateLabel: 'Beta',
            overallFitScore: 0.9,
          }),
        ]}
        candidateCount={2}
      />,
    );

    const candidateHeaderButton = screen.getByRole('button', {
      name: /Candidate/i,
    });
    const fitScoreHeaderButton = screen.getByRole('button', {
      name: /Fit Score/i,
    });

    const candidateHeader = candidateHeaderButton.closest('th');
    const fitScoreHeader = fitScoreHeaderButton.closest('th');
    expect(candidateHeader).toHaveAttribute('aria-sort', 'none');
    expect(fitScoreHeader).toHaveAttribute('aria-sort', 'none');

    await user.click(candidateHeaderButton);
    expect(candidateHeader).toHaveAttribute('aria-sort', 'ascending');
    expect(fitScoreHeader).toHaveAttribute('aria-sort', 'none');

    await user.click(candidateHeaderButton);
    expect(candidateHeader).toHaveAttribute('aria-sort', 'descending');
    expect(fitScoreHeader).toHaveAttribute('aria-sort', 'none');

    await user.click(fitScoreHeaderButton);
    expect(candidateHeader).toHaveAttribute('aria-sort', 'none');
    expect(fitScoreHeader).toHaveAttribute('aria-sort', 'descending');
  });
});
