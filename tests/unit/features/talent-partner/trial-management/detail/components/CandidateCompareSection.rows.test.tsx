import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CandidateCompareSection } from '@/features/talent-partner/trial-management/detail/components/CandidateCompareSection';
import { baseProps, makeRow } from './CandidateCompareSection.testlib';

describe('CandidateCompareSection row rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders partial rows with score fallback and generate action', async () => {
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
            winoeReportStatus: 'not_generated',
            overallWinoeScore: null,
            recommendation: null,
          }),
        ]}
        candidateCount={1}
      />,
    );

    const row = screen.getByTestId('candidate-compare-row-cand-2');
    expect(within(row).getByText('—')).toBeInTheDocument();
    const generateButton = within(row).getByRole('button', {
      name: /Generate Winoe Report/i,
    });
    await user.click(generateButton);
    expect(onGenerate).toHaveBeenCalledWith('cand-2');
  });

  it('disables generate button while winoe report is generating', () => {
    render(
      <CandidateCompareSection
        {...baseProps}
        rows={[
          makeRow({
            candidateSessionId: 'cand-4',
            winoeReportStatus: 'generating',
            overallWinoeScore: null,
            recommendation: null,
          }),
        ]}
        candidateCount={1}
      />,
    );
    const row = screen.getByTestId('candidate-compare-row-cand-4');
    expect(
      within(row).getByRole('button', { name: /Generating Winoe Report/i }),
    ).toBeDisabled();
  });

  it('renders ready rows with score, recommendation, strengths, and links', () => {
    render(
      <CandidateCompareSection
        {...baseProps}
        rows={[
          makeRow({
            candidateSessionId: 'cand-9',
            candidateLabel: 'Candidate Nine',
            overallWinoeScore: 0.84,
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
    ).toHaveAttribute('href', '/dashboard/trials/trial-1/candidates/cand-9');
  });
});
