import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CandidateCompareSection } from '@/features/talent-partner/trial-management/detail/components/CandidateCompareSection';
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
    expect(screen.getByText('Benchmarks')).toBeInTheDocument();
    expect(
      document.querySelectorAll('[aria-hidden="true"]').length,
    ).toBeGreaterThan(0);
  });

  it('renders empty state when no candidates exist', () => {
    render(
      <CandidateCompareSection {...baseProps} candidateCount={0} rows={[]} />,
    );
    expect(screen.getByText('No completed candidates yet')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Benchmarks will appear once candidates complete this Trial and Winoe Reports are available.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        'Limited comparison — results are more meaningful with additional candidates.',
      ),
    ).not.toBeInTheDocument();
  });

  it('renders empty state when all raw compare rows are filtered upstream', () => {
    render(
      <CandidateCompareSection {...baseProps} candidateCount={1} rows={[]} />,
    );
    expect(screen.getByText('No completed candidates yet')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Benchmarks will appear once candidates complete this Trial and Winoe Reports are available.',
      ),
    ).toBeInTheDocument();
  });

  it('renders compare error state with retry', async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();
    render(
      <CandidateCompareSection
        {...baseProps}
        onRetry={onRetry}
        compareError="Unable to load Benchmarks."
        candidateCount={2}
      />,
    );
    expect(screen.getByText('Unable to load Benchmarks.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
