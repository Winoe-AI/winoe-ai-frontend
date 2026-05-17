import Button from '@/shared/ui/Button';
import { formatGeneratedAt } from '../utils/reportFormatting';

type Props = {
  candidateName: string;
  trialTitle: string;
  generatedAt: string;
  onDownloadPdf: () => void;
};

export function IdentityBar({
  candidateName,
  trialTitle,
  generatedAt,
  onDownloadPdf,
}: Props) {
  return (
    <header className="identity-bar flex flex-col gap-3 border-b border-subtle pb-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary">
          Winoe Report
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-primary md:text-3xl">
          {candidateName} · {trialTitle}
        </h1>
        <p className="text-sm text-secondary">
          Generated {formatGeneratedAt(generatedAt)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={onDownloadPdf} data-winoe-report-no-print="true">
          Download PDF
        </Button>
      </div>
    </header>
  );
}
