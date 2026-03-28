'use client';
import Link from 'next/link';
import PageHeader from '@/shared/ui/PageHeader';
import Button from '@/shared/ui/Button';
import { StatusPill } from '@/shared/ui/StatusPill';
import { statusMeta } from '@/shared/status/statusMeta';

type Props = {
  title: string;
  subtitle: string;
  backHref: string;
  fitProfileHref: string;
  status?: string | null;
  inviteEmail?: string | null;
  onRefresh: () => void;
};

const LINK_PREFETCH = process.env.NODE_ENV === 'test' ? undefined : false;

export function SubmissionsHeader({
  title,
  subtitle,
  backHref,
  fitProfileHref,
  status,
  inviteEmail,
  onRefresh,
}: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="flex flex-wrap items-center gap-2">
        {status ? (
          <StatusPill
            label={statusMeta(status).label}
            tone={statusMeta(status).tone}
          />
        ) : null}
        {inviteEmail ? (
          <span className="text-sm text-gray-600">{inviteEmail}</span>
        ) : null}
        <Button
          variant="secondary"
          size="sm"
          onClick={onRefresh}
          aria-label="reload-submissions"
        >
          Reload
        </Button>
        <Link
          className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
          href={fitProfileHref}
          prefetch={LINK_PREFETCH}
        >
          Fit Profile
        </Link>
        <Link
          className="text-sm text-blue-600 hover:underline"
          href={backHref}
          prefetch={LINK_PREFETCH}
        >
          ← Back to candidates
        </Link>
      </div>
    </div>
  );
}
