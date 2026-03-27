import { render, screen } from '@testing-library/react';
import { CandidateSessionView } from '@/features/candidate/session/CandidateSessionView';
import { buildCandidateSessionViewProps } from './CandidateSessionView.windowGating.testProps';

describe('CandidateSessionView window gating', () => {
  it('renders countdown/read-only banner and disables submit', () => {
    render(<CandidateSessionView {...buildCandidateSessionViewProps()} />);
    expect(screen.getByText(/^Day 1 is not open yet$/i)).toBeInTheDocument();
    expect(screen.getByText(/Come back at/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit & continue/i })).toBeDisabled();
  });
});
