import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CandidateCompareSection } from '@/features/recruiter/simulations/detail/components/CandidateCompareSection';
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
    const generateButton = within(row).getByRole('button', { name: /Generate Fit Profile/i });
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
            fitProfileStatus: 'generating',
            overallFitScore: null,
            recommendation: null,
          }),
        ]}
        candidateCount={1}
      />,
    );
    const row = screen.getByTestId('candidate-compare-row-cand-4');
    expect(within(row).getByRole('button', { name: /Generating Fit Profile/i })).toBeDisabled();
  });

  it('renders ready rows with score, recommendation, strengths, and links', () => {
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
    expect(within(row).getByText('Strength: Clear API communication')).toBeInTheDocument();
    expect(within(row).getByText('Risk: Small testing gaps')).toBeInTheDocument();
    expect(within(row).getByRole('link', { name: /View Submissions/i })).toHaveAttribute(
      'href',
      '/dashboard/simulations/sim-1/candidates/cand-9',
    );
  });
});
