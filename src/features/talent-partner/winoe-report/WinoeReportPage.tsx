'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { WinoeReportStatusPanel } from './WinoeReportStatusPanel';
import { WinoeReportWarningBanner } from './WinoeReportWarningBanner';
import { useWinoeReportContext } from './useWinoeReportContext';
import { useWinoeReport } from './useWinoeReport';
import { useWinoeReportPrintMode } from './useWinoeReportPrintMode';
import { normalizeWinoeReportViewModel } from './winoeReport.viewModel';
import { WinoeReportView } from './WinoeReportView';

export default function WinoeReportPage() {
  const params = useParams<{ id: string; candidateSessionId: string }>();
  const trialId = params.id;
  const candidateSessionId = params.candidateSessionId ?? '';
  const { trialTitle, candidateName } = useWinoeReportContext({
    trialId,
    candidateSessionId,
  });
  const { state, loading, generatePending, generate, reload } =
    useWinoeReport(candidateSessionId);
  useWinoeReportPrintMode();

  const viewModel = useMemo(() => {
    if (!state.report) return null;
    return normalizeWinoeReportViewModel({
      candidateName,
      trialTitle,
      generatedAt: state.generatedAt,
      report: state.report,
    });
  }, [candidateName, state.generatedAt, state.report, trialTitle]);

  const compareHref = trialId
    ? `/talent-partner/trials/${trialId}/benchmarks`
    : null;
  const submissionHref = trialId
    ? `/talent-partner/trials/${trialId}/candidates/${candidateSessionId}/submission`
    : null;

  if (viewModel) {
    return (
      <div className="winoe-report-print-root py-6">
        <WinoeReportWarningBanner warnings={state.warnings} />
        <WinoeReportView
          viewModel={viewModel}
          onDownloadPdf={() => window.print()}
          compareHref={compareHref}
          submissionHref={submissionHref}
        />
      </div>
    );
  }

  return (
    <div className="winoe-report-print-root flex flex-col gap-4 py-8">
      <WinoeReportWarningBanner warnings={state.warnings} />
      <div className="mx-auto w-full max-w-[960px] px-4 md:px-6">
        <WinoeReportStatusPanel
          status={state.status}
          message={state.message}
          errorCode={state.errorCode}
          loading={loading}
          generatePending={generatePending}
          onGenerate={() => void generate()}
          onRetry={() => void reload()}
        />
      </div>
    </div>
  );
}
