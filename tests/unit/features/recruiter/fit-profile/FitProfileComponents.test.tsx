import React from 'react';
import { render, screen } from '@testing-library/react';
import { DayScoreCard } from '@/features/recruiter/simulations/candidates/fitProfile/DayScoreCard';
import { EvidenceList } from '@/features/recruiter/simulations/candidates/fitProfile/EvidenceList';
import { FitProfileWarningBanner } from '@/features/recruiter/simulations/candidates/fitProfile/FitProfileWarningBanner';
import { FitScoreHeader } from '@/features/recruiter/simulations/candidates/fitProfile/FitScoreHeader';

describe('Fit Profile components', () => {
  it('renders score header recommendation and calibration', () => {
    render(
      <FitScoreHeader
        overallFitScore={0.78}
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

  it('renders explicit not-evaluated day card state', () => {
    render(
      <DayScoreCard
        dayScore={{
          dayIndex: 4,
          score: null,
          evaluationStatus: 'not_evaluated',
          reason: 'ai_eval_disabled_for_day',
          aiEvaluationEnabled: false,
          rubricBreakdown: {},
          evidence: [],
        }}
      />,
    );

    expect(screen.getByText('Day 4')).toBeInTheDocument();
    expect(screen.getByText('AI Evaluation: Disabled')).toBeInTheDocument();
    expect(
      screen.getByText(/AI evaluation disabled for this day./i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Human review required./i)).toBeInTheDocument();
    expect(
      screen.queryByText(/This day was not evaluated and does not affect/i),
    ).not.toBeInTheDocument();
  });

  it('renders evidence links with safe external link attributes', () => {
    render(
      <EvidenceList
        evidence={[
          {
            kind: 'commit',
            ref: 'abc123',
            url: 'https://github.com/org/repo/commit/abc123?token=private-token',
            excerpt: 'Implemented endpoint and tests.',
            startMs: null,
            endMs: null,
          },
        ]}
      />,
    );

    const link = screen.getByRole('link', { name: /Open evidence link/i });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer noopener');
    expect(screen.getByText(/URL:/)).toHaveTextContent(
      'https://github.com/org/repo/commit/abc123',
    );
    expect(screen.getByText(/URL:/)).not.toHaveTextContent('token=');
  });

  it('renders warning banner entries', () => {
    render(
      <FitProfileWarningBanner
        warnings={[
          'Some artifacts were unavailable. The report is based on partial evidence.',
        ]}
      />,
    );

    expect(screen.getByText(/Report warnings/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Some artifacts were unavailable/i),
    ).toBeInTheDocument();
  });
});
