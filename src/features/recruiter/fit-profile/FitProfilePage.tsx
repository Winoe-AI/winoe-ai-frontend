'use client';

import { useParams } from 'next/navigation';
import { Card } from '@/shared/ui/Card';
import { FitProfilePageToolbar } from './FitProfilePageToolbar';
import { FitProfileReadySection } from './FitProfileReadySection';
import { FitProfileStatusPanel } from './FitProfileStatusPanel';
import { FitProfileWarningBanner } from './FitProfileWarningBanner';
import { useFitProfile } from './useFitProfile';
import { useFitProfilePrintMode } from './useFitProfilePrintMode';

export default function FitProfilePage() {
  const params = useParams<{ id: string; candidateSessionId: string }>();
  const simulationId = params.id;
  const candidateSessionId = params.candidateSessionId ?? '';
  const { state, loading, generatePending, generate, reload } =
    useFitProfile(candidateSessionId);
  useFitProfilePrintMode();

  const submissionsHref = `/dashboard/simulations/${simulationId}/candidates/${candidateSessionId}`;

  return (
    <div className="fit-profile-print-root flex flex-col gap-4 py-8">
      <FitProfilePageToolbar
        submissionsHref={submissionsHref}
        loading={loading}
        showPrint={state.status === 'ready'}
        onReload={() => void reload()}
      />

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
        <FitProfileReadySection
          report={state.report}
          generatedAt={state.generatedAt}
        />
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
