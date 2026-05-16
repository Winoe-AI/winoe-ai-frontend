import Button from '@/shared/ui/Button';
import { ModalShell } from './ModalShell';

type Props = {
  open: boolean;
  onClose: () => void;
  onDownloadPdf: () => void;
};

export function ShareReportModal({ open, onClose, onDownloadPdf }: Props) {
  return (
    <ModalShell open={open} title="Share this report" onClose={onClose}>
      <div className="space-y-5">
        <p className="max-w-[56ch] text-sm leading-6 text-secondary">
          Secure team sharing is not enabled yet. Download the PDF to share the
          Evidence Trail with your team.
        </p>
        <div className="rounded-2xl border border-dashed border-subtle bg-secondary p-4 text-sm text-secondary">
          Copy link is unavailable until a signed read-only link is supported.
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="sm" onClick={onDownloadPdf}>
            Download PDF
          </Button>
          <Button variant="ghost" size="sm" disabled>
            Copy link
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
