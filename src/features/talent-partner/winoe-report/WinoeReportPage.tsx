'use client';

import { useParams } from 'next/navigation';
import { Card } from '@/shared/ui/Card';
import { WinoeReportPageToolbar } from './WinoeReportPageToolbar';
import { WinoeReportReadySection } from './WinoeReportReadySection';
import { WinoeReportStatusPanel } from './WinoeReportStatusPanel';
import { WinoeReportWarningBanner } from './WinoeReportWarningBanner';
import { useWinoeReport } from './useWinoeReport';
import { useWinoeReportPrintMode } from './useWinoeReportPrintMode';

export default function WinoeReportPage() {
  const params = useParams<{ id: string; candidateSessionId: string }>();
  const trialId = params.id;
  const candidateSessionId = params.candidateSessionId ?? '';
  const { state, loading, generatePending, generate, reload } =
    useWinoeReport(candidateSessionId);
  useWinoeReportPrintMode();

  const submissionsHref = `/dashboard/trials/${trialId}/candidates/${candidateSessionId}`;

  return (
    <div className="winoe-report-print-root flex flex-col gap-4 py-8">
      <WinoeReportPageToolbar
        submissionsHref={submissionsHref}
        loading={loading}
        showPrint={state.status === 'ready'}
        onReload={() => void reload()}
      />

      <Card className="winoe-report-avoid-break">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Winoe Report
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Talent Partner report for candidate session {candidateSessionId}.
        </p>
      </Card>

      <WinoeReportWarningBanner warnings={state.warnings} />

      {state.status === 'ready' && state.report ? (
        <WinoeReportReadySection
          report={state.report}
          generatedAt={state.generatedAt}
        />
      ) : (
        <WinoeReportStatusPanel
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
