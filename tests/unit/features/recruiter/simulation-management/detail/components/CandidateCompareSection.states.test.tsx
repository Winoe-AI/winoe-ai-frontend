import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CandidateCompareSection } from '@/features/recruiter/simulation-management/detail/components/CandidateCompareSection';
import { baseProps } from './CandidateCompareSection.testlib';

describe('CandidateCompareSection states', () => {
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

  it('renders empty state when no candidates exist', () => {
    render(
      <CandidateCompareSection {...baseProps} candidateCount={0} rows={[]} />,
    );
    expect(screen.getByText('No comparison data yet')).toBeInTheDocument();
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
});
