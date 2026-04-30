import { render, screen } from '@testing-library/react';
import { LatestDay4Handoff } from '@/features/talent-partner/submission-review/components/LatestDay4Handoff';

describe('LatestDay4Handoff', () => {
  it('renders Day 4 Handoff + Demo evidence copy', () => {
    render(
      <LatestDay4Handoff
        artifact={null}
        hasHandoffSubmission={false}
        loading={false}
      />,
    );

    expect(
      screen.getByText(/Day 4 Handoff \+ Demo evidence/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Playback and transcript review for the latest Day 4 Handoff \+ Demo\./i,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/presentation/i)).toBeNull();
  });

  it('uses Handoff + Demo wording for loading and fallback states', () => {
    const { rerender } = render(
      <LatestDay4Handoff
        artifact={null}
        hasHandoffSubmission={false}
        loading
      />,
    );

    expect(
      screen.getByText(/Loading Day 4 Handoff \+ Demo details/i),
    ).toBeInTheDocument();

    rerender(
      <LatestDay4Handoff
        artifact={null}
        hasHandoffSubmission={true}
        loading={false}
      />,
    );

    expect(
      screen.getByText(
        /Day 4 Handoff \+ Demo found, but artifact details are unavailable\./i,
      ),
    ).toBeInTheDocument();

    rerender(
      <LatestDay4Handoff
        artifact={null}
        hasHandoffSubmission={false}
        loading={false}
      />,
    );

    expect(
      screen.getByText(/Day 4 Handoff \+ Demo not available yet\./i),
    ).toBeInTheDocument();
  });
});
