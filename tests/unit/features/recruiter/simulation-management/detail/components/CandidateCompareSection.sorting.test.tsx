import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CandidateCompareSection } from '@/features/recruiter/simulation-management/detail/components/CandidateCompareSection';
import { baseProps, makeRow } from './CandidateCompareSection.testlib';

const rowOrder = () =>
  screen
    .getAllByTestId(/candidate-compare-row-/)
    .map((row) => row.getAttribute('data-testid'));

describe('CandidateCompareSection sorting', () => {
  it('sorts by default rank and toggles candidate sorting', async () => {
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
            overallFitScore: 0.7,
            updatedAt: '2026-03-14T00:00:00Z',
          }),
          makeRow({
            candidateSessionId: 'c-z',
            candidateLabel: 'Zed',
            overallFitScore: 0.9,
            updatedAt: '2026-03-16T00:00:00Z',
          }),
        ]}
        candidateCount={3}
      />,
    );

    expect(rowOrder()).toEqual([
      'candidate-compare-row-c-z',
      'candidate-compare-row-c-a',
      'candidate-compare-row-c-b',
    ]);
    await user.click(screen.getByRole('button', { name: /Candidate/i }));
    expect(rowOrder()).toEqual([
      'candidate-compare-row-c-a',
      'candidate-compare-row-c-b',
      'candidate-compare-row-c-z',
    ]);
    await user.click(screen.getByRole('button', { name: /Candidate/i }));
    expect(rowOrder()).toEqual([
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
    await user.click(candidateHeaderButton);
    expect(candidateHeader).toHaveAttribute('aria-sort', 'descending');
    await user.click(fitScoreHeaderButton);
    expect(candidateHeader).toHaveAttribute('aria-sort', 'none');
    expect(fitScoreHeader).toHaveAttribute('aria-sort', 'descending');
  });
});
