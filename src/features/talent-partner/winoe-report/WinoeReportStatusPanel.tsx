import Button from '@/shared/ui/Button';
import type { WinoeReportViewStatus } from './winoeReport.types';

type WinoeReportStatusPanelProps = {
  status: WinoeReportViewStatus;
  message: string;
  errorCode: string | null;
  loading: boolean;
  generatePending: boolean;
  onGenerate: () => void;
  onRetry: () => void;
};

function spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"
      aria-hidden="true"
    />
  );
}

export function WinoeReportStatusPanel({
  status,
  message,
  errorCode,
  loading,
  generatePending,
  onGenerate,
  onRetry,
}: WinoeReportStatusPanelProps) {
  if (status === 'generating') {
    return (
      <div className="rounded border border-blue-200 bg-blue-50 p-4 text-blue-900">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {spinner()}
          <span>Generating Winoe Report</span>
        </div>
        <p className="mt-2 text-sm text-blue-800">{message}</p>
      </div>
    );
  }

  if (status === 'access_denied') {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {message}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-4 text-red-800">
        <p className="text-sm font-semibold">Unable to load Winoe Report</p>
        <p className="mt-1 text-sm">{message}</p>
        {errorCode ? (
          <p className="mt-1 font-mono text-xs text-red-700">
            Code: {errorCode}
          </p>
        ) : null}
        <div className="mt-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            loading={loading}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-700">
      <p className="text-base font-semibold text-gray-900">
        Winoe Report not generated
      </p>
      <p className="mt-1">{message}</p>
      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" onClick={onGenerate} loading={generatePending}>
          Generate Winoe Report
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          loading={loading}
        >
          Refresh
        </Button>
      </div>
    </div>
  );
}
