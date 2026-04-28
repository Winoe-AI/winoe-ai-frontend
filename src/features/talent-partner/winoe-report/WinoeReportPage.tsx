'use client';

import { useParams } from 'next/navigation';
import { WinoeReportPageToolbar } from './WinoeReportPageToolbar';
import { WinoeReportReadySection } from './WinoeReportReadySection';
import { WinoeReportStatusPanel } from './WinoeReportStatusPanel';
import { WinoeReportWarningBanner } from './WinoeReportWarningBanner';
import { useWinoeReportContext } from './useWinoeReportContext';
import { useWinoeReport } from './useWinoeReport';
import { useWinoeReportPrintMode } from './useWinoeReportPrintMode';

export default function WinoeReportPage() {
  const params = useParams<{ id: string; candidateSessionId: string }>();
  const trialId = params.id;
  const candidateSessionId = params.candidateSessionId ?? '';
  const { trialTitle, candidateName, candidateStatus } = useWinoeReportContext({
    trialId,
    candidateSessionId,
  });
  const { state, loading, generatePending, generate, reload } =
    useWinoeReport(candidateSessionId);
  useWinoeReportPrintMode();

  const submissionsHref = `/dashboard/trials/${trialId}/candidates/${candidateSessionId}`;

  return (
    <div className="winoe-report-print-root flex flex-col gap-4 py-8">
      <WinoeReportPageToolbar
        submissionsHref={submissionsHref}
        candidateSessionId={candidateSessionId}
        trialTitle={trialTitle}
        candidateName={candidateName}
        candidateStatus={candidateStatus}
        reportStatus={state.status}
        generatedAt={state.generatedAt}
        loading={loading}
        showPrint={state.status === 'ready'}
        onReload={() => void reload()}
      />

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
