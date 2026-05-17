import Link from 'next/link';
import Button from '@/shared/ui/Button';

type Props = {
  onDownloadPdf: () => void;
  onShare: () => void;
  compareHref: string | null;
  submissionHref: string | null;
};

export function FooterActions({
  onDownloadPdf,
  onShare,
  compareHref,
  submissionHref,
}: Props) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-primary">
          Next steps
        </h2>
        <p className="mt-1 text-sm text-secondary">
          The Talent Partner keeps the decision. Winoe keeps the evidence.
        </p>
      </div>
      <div
        className="footer-actions flex flex-wrap gap-3"
        data-winoe-report-no-print="true"
      >
        <Button onClick={onDownloadPdf}>Download PDF</Button>
        <Button variant="secondary" onClick={onShare}>
          Share with team
        </Button>
        {submissionHref ? (
          <Link
            href={submissionHref}
            className="inline-flex items-center justify-center rounded-md border border-subtle bg-transparent px-4 py-2 text-sm font-medium text-secondary transition hover:bg-secondary hover:text-primary focus:outline-none focus:ring-2 focus:ring-wheat-500"
          >
            View raw submission
          </Link>
        ) : null}
        {compareHref ? (
          <Link
            href={compareHref}
            className="inline-flex items-center justify-center rounded-md border border-subtle bg-transparent px-4 py-2 text-sm font-medium text-secondary transition hover:bg-secondary hover:text-primary focus:outline-none focus:ring-2 focus:ring-wheat-500"
          >
            Open Benchmarks
          </Link>
        ) : (
          <Button variant="secondary" disabled>
            Benchmarks unavailable for this Trial
          </Button>
        )}
      </div>
    </section>
  );
}
