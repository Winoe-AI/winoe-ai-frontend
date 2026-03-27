import Link from 'next/link';
import Button from '@/shared/ui/Button';

type Props = {
  submissionsHref: string;
  loading: boolean;
  showPrint: boolean;
  onReload: () => void;
};

export function FitProfilePageToolbar({
  submissionsHref,
  loading,
  showPrint,
  onReload,
}: Props) {
  return (
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
          onClick={onReload}
          loading={loading}
        >
          Reload
        </Button>
        {showPrint ? (
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            Print / Save PDF
          </Button>
        ) : null}
      </div>
    </div>
  );
}
