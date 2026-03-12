'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Button from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { DayScoreCard } from './DayScoreCard';
import { FitProfileStatusPanel } from './FitProfileStatusPanel';
import { FitProfileWarningBanner } from './FitProfileWarningBanner';
import { FitScoreHeader } from './FitScoreHeader';
import { useFitProfile } from './useFitProfile';

export default function FitProfilePage() {
  const params = useParams<{ id: string; candidateSessionId: string }>();
  const simulationId = params.id;
  const candidateSessionId = params.candidateSessionId ?? '';
  const { state, loading, generatePending, generate, reload } =
    useFitProfile(candidateSessionId);

  useEffect(() => {
    document.body.classList.add('fit-profile-print-mode');
    return () => {
      document.body.classList.remove('fit-profile-print-mode');
    };
  }, []);

  const submissionsHref = `/dashboard/simulations/${simulationId}/candidates/${candidateSessionId}`;

  return (
    <div className="fit-profile-print-root flex flex-col gap-4 py-8">
      <div
        className="flex flex-wrap items-center justify-between gap-2"
        data-fit-profile-no-print="true"
      >
        <Link
          className="text-sm text-blue-600 hover:underline"
          href={submissionsHref}
        >
          &larr; Back to submissions
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void reload()}
            loading={loading}
          >
            Reload
          </Button>
          {state.status === 'ready' ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.print()}
            >
              Print / Save PDF
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="fit-profile-avoid-break">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Fit Profile
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Recruiter report for candidate session {candidateSessionId}.
        </p>
      </Card>

      <FitProfileWarningBanner warnings={state.warnings} />

      {state.status === 'ready' && state.report ? (
        <>
          <FitScoreHeader
            overallFitScore={state.report.overallFitScore}
            recommendation={state.report.recommendation}
            confidence={state.report.confidence}
            calibrationText={state.report.calibrationText}
            generatedAt={state.generatedAt}
            disabledDayIndexes={state.report.disabledDayIndexes}
            scoredDayCount={
              state.report.dayScores.filter(
                (item) => item.evaluationStatus === 'evaluated',
              ).length
            }
          />
          {state.report.dayScores.length === 0 ? (
            <Card className="fit-profile-avoid-break text-sm text-gray-600">
              No day-level scores are available for this report.
            </Card>
          ) : (
            <section className="space-y-3">
              {state.report.dayScores.map((dayScore) => (
                <DayScoreCard
                  key={`fit-profile-day-${dayScore.dayIndex}`}
                  dayScore={dayScore}
                />
              ))}
            </section>
          )}
        </>
      ) : (
        <FitProfileStatusPanel
          status={state.status}
          message={state.message}
          errorCode={state.errorCode}
          loading={loading}
          generatePending={generatePending}
          onGenerate={() => void generate()}
          onRetry={() => void reload()}
        />
      )}
    </div>
  );
}
