import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DayScoreCard } from '@/features/talent-partner/winoe-report/DayScoreCard';
import { WinoeDimensionBreakdown } from '@/features/talent-partner/winoe-report/WinoeDimensionBreakdown';
import { WinoeScoreHeader } from '@/features/talent-partner/winoe-report/WinoeScoreHeader';
import { ScoreRing } from '@/features/talent-partner/winoe-report/components/ScoreRing';
import { FooterActions } from '@/features/talent-partner/winoe-report/components/FooterActions';
import { RadarChart } from '@/features/talent-partner/winoe-report/components/RadarChart';

describe('Winoe Report components', () => {
  it('renders score header narrative and calibration', () => {
    render(
      <WinoeScoreHeader
        overallWinoeScore={0.78}
        recommendation="strong_hire"
        confidence={0.74}
        calibrationText={null}
        generatedAt="2026-03-11T10:00:00.000Z"
        disabledDayIndexes={[4]}
        dimensionCount={2}
        scoredDayCount={3}
        narrativeAssessment="Evidence suggests strong alignment with this Trial's engineering demands."
      />,
    );
    expect(screen.getByText('78 / 100')).toBeInTheDocument();
    expect(
      screen.getByText(/Winoe's narrative assessment/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Confidence 74% based on rubric-aligned evidence/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/2 dimensions linked/i)).toBeInTheDocument();
    expect(screen.getByText(/Disabled days: 4/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Evidence suggests strong alignment with this Trial\./i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Winoe persona/i)).not.toBeInTheDocument();
  });

  it('renders the hero score ring without out-of-100 suffix text', async () => {
    render(<ScoreRing score={0.6731} />);
    await waitFor(() =>
      expect(screen.getByText(/^(?:66\.9|67)$/)).toBeInTheDocument(),
    );
    expect(screen.queryByText(/\/ 100/)).not.toBeInTheDocument();
    expect(screen.getByText(/Winoe Score/i)).toBeInTheDocument();
  });

  it.each([
    ['hire', 'Evidence suggests strong alignment with this Trial.'],
    ['strong_hire', 'Evidence suggests strong alignment with this Trial.'],
    ['reject', 'Evidence shows material concerns to review.'],
    ['do_not_proceed', 'Evidence shows material concerns to review.'],
  ] as const)(
    'translates backend recommendation value %s into evidence language',
    (recommendation, expectedCopy) => {
      render(
        <WinoeScoreHeader
          overallWinoeScore={0.5}
          recommendation={recommendation}
          confidence={0.52}
          calibrationText={null}
          generatedAt={null}
          disabledDayIndexes={[]}
          dimensionCount={0}
          scoredDayCount={0}
          narrativeAssessment={null}
        />,
      );
      expect(screen.getByText(expectedCopy)).toBeInTheDocument();
      expect(screen.queryByText(/^Hire$/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/^Reject$/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/^Pass$/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/^Fail$/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/^Proceed$/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Do not proceed/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Recommended hire/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Not recommended/i)).not.toBeInTheDocument();
    },
  );

  it('renders day score card with rubric breakdown', () => {
    render(
      <DayScoreCard
        dayScore={{
          dayIndex: 2,
          score: 0.61,
          evaluationStatus: 'evaluated',
          reason: null,
          aiEvaluationEnabled: true,
          rubricBreakdown: {
            problemSolving: 0.7,
            communication: 'clear and direct',
          },
          evidence: [],
        }}
      />,
    );
    expect(screen.getByText('Day 2')).toBeInTheDocument();
    expect(screen.getByText('61 / 100')).toBeInTheDocument();
    expect(screen.getByText('Problem Solving')).toBeInTheDocument();
    expect(screen.getByText('0.7')).toBeInTheDocument();
    expect(screen.getByText('clear and direct')).toBeInTheDocument();
  });

  it('renders dimension drill-down and evidence trail', async () => {
    const user = userEvent.setup();
    render(
      <WinoeDimensionBreakdown
        dimensions={[
          {
            key: 'project_scaffolding_quality',
            label: 'Project scaffolding quality',
            score: 0.83,
            summary: 'Repository structure was established early.',
            evidenceCount: 1,
            linkedArtifactCount: 1,
            sourceKeys: ['project_scaffolding_quality'],
            emptyStateMessage: null,
            description: 'How clearly the repository was structured.',
            evidence: [
              {
                kind: 'commit',
                ref: 'abc123',
                url: 'https://github.com/org/repo/commit/abc123',
                excerpt: 'Initial scaffolding commit.',
                startMs: null,
                endMs: null,
                dayIndex: 2,
                dayLabel: 'Day 2',
              },
            ],
          },
          {
            key: 'architectural_coherence',
            label: 'Architectural coherence',
            score: null,
            summary: null,
            evidenceCount: 0,
            linkedArtifactCount: 0,
            sourceKeys: ['architectural_coherence'],
            emptyStateMessage:
              'No linked artifacts were returned for this dimension yet.',
            description: 'How well the implementation boundaries fit together.',
            evidence: [],
          },
        ]}
      />,
    );

    expect(
      screen.getByRole('button', { name: /Project scaffolding quality/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Architectural coherence/i }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: /Project scaffolding quality/i }),
    );
    expect(screen.getByText(/Evidence Trail drill-down/i)).toBeInTheDocument();
    expect(screen.getByText(/Initial scaffolding commit/i)).toBeInTheDocument();

    const secondButton = screen.getByRole('button', {
      name: /Architectural coherence/i,
    });
    secondButton.focus();
    await user.keyboard('{Enter}');
    expect(
      screen.getByRole('heading', { name: /Architectural coherence/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        /No linked artifacts were returned for this dimension yet\./i,
      ).length,
    ).toBeGreaterThan(0);
  });

  it('renders a disabled benchmarks fallback when compare href is missing', () => {
    render(
      <FooterActions
        onDownloadPdf={jest.fn()}
        onShare={jest.fn()}
        compareHref={null}
      />,
    );

    expect(
      screen.getByRole('button', {
        name: /Benchmarks unavailable for this Trial/i,
      }),
    ).toBeDisabled();
    expect(
      screen.queryByRole('link', {
        name: /Compare to other candidates/i,
      }),
    ).not.toBeInTheDocument();
  });

  it('uses Benchmarks language for the radar fallback', () => {
    render(
      <RadarChart
        dimensions={[
          {
            id: 'project_scaffolding_quality',
            name: 'Project scaffolding quality',
            score: 7.8,
            justification: 'Repository structure was established early.',
            citations: [],
          },
        ]}
      />,
    );

    expect(
      screen.getByRole('img', {
        name: /Winoe Report dimensional radar chart/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Benchmarks unavailable for this report/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Cohort median unavailable/i),
    ).not.toBeInTheDocument();
  });
});
