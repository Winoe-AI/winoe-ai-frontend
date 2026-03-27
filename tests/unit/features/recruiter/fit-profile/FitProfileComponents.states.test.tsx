import React from 'react';
import { render, screen } from '@testing-library/react';
import { DayScoreCard } from '@/features/recruiter/fit-profile/DayScoreCard';
import { EvidenceList } from '@/features/recruiter/fit-profile/EvidenceList';
import { FitProfileWarningBanner } from '@/features/recruiter/fit-profile/FitProfileWarningBanner';

describe('Fit Profile components states', () => {
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
