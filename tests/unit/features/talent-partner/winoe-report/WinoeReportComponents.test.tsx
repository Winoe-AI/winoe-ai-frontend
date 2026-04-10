import React from 'react';
import { render, screen } from '@testing-library/react';
import { DayScoreCard } from '@/features/talent-partner/winoe-report/DayScoreCard';
import { WinoeScoreHeader } from '@/features/talent-partner/winoe-report/WinoeScoreHeader';

describe('Winoe Report components', () => {
  it('renders score header recommendation and calibration', () => {
    render(
      <WinoeScoreHeader
        overallWinoeScore={0.78}
        recommendation="hire"
        confidence={0.74}
        calibrationText={null}
        generatedAt="2026-03-11T10:00:00.000Z"
        disabledDayIndexes={[4]}
        scoredDayCount={3}
      />,
    );
    expect(screen.getByText('78%')).toBeInTheDocument();
    expect(screen.getByText('Hire')).toBeInTheDocument();
    expect(
      screen.getByText(/Confidence 74% based on rubric-aligned evidence/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Disabled days excluded from scoring: 4/i),
    ).toBeInTheDocument();
  });

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
    expect(screen.getByText('61%')).toBeInTheDocument();
    expect(screen.getByText('Problem Solving')).toBeInTheDocument();
    expect(screen.getByText('0.7')).toBeInTheDocument();
    expect(screen.getByText('clear and direct')).toBeInTheDocument();
  });
});
