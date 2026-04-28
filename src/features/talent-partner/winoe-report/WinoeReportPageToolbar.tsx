import Link from 'next/link';
import Button from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { formatStatusLabel, formatGeneratedAt } from './winoeReportFormatting';

type Props = {
  submissionsHref: string;
  candidateSessionId: string;
  trialTitle: string;
  candidateName: string | null;
  candidateStatus: string | null;
  reportStatus: string;
  generatedAt: string | null;
  loading: boolean;
  showPrint: boolean;
  onReload: () => void;
};

export function WinoeReportPageToolbar({
  submissionsHref,
  candidateSessionId,
  trialTitle,
  candidateName,
  candidateStatus,
  reportStatus,
  generatedAt,
  loading,
  showPrint,
  onReload,
}: Props) {
  return (
    <Card className="winoe-report-avoid-break border-slate-200 bg-slate-50/80 shadow-none">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Talent Partner artifact
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
              Winoe Report
            </h1>
            <p className="mt-2 text-sm text-slate-700">
              {candidateName
                ? candidateName
                : `Candidate session ${candidateSessionId}`}{' '}
              | {trialTitle}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-700">
            <span className="rounded-full border border-slate-300 bg-white px-3 py-1">
              Candidate session status: {formatStatusLabel(candidateStatus)}
            </span>
            <span className="rounded-full border border-slate-300 bg-white px-3 py-1">
              Report status: {formatStatusLabel(reportStatus)}
            </span>
            {generatedAt ? (
              <span className="rounded-full border border-slate-300 bg-white px-3 py-1">
                Generated: {formatGeneratedAt(generatedAt)}
              </span>
            ) : null}
          </div>
        </div>

        <div
          className="flex flex-wrap items-center gap-2 lg:justify-end"
          data-winoe-report-no-print="true"
        >
          <Link
            className="text-sm text-blue-600 hover:underline"
            href={submissionsHref}
          >
            &larr; Back to submissions
          </Link>
          <Button
            variant="secondary"
            size="sm"
            onClick={onReload}
            loading={loading}
          >
            Reload
          </Button>
          {showPrint ? (
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
    </Card>
  );
}
