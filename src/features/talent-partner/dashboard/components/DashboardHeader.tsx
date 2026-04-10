import PageHeader from '@/shared/ui/PageHeader';
import Button from '@/shared/ui/Button';
import Link from 'next/link';

type DashboardHeaderProps = {
  onNewTrial?: () => void;
};

const LINK_PREFETCH = process.env.NODE_ENV === 'test' ? undefined : false;

export function DashboardHeader({ onNewTrial }: DashboardHeaderProps) {
  return (
    <PageHeader
      title="Dashboard"
      actions={
        <>
          <Link href="/dashboard/settings/ai" prefetch={LINK_PREFETCH}>
            <Button type="button" variant="secondary">
              AI Settings
            </Button>
          </Link>
          <Link href="/dashboard/trials/new" prefetch={LINK_PREFETCH}>
            <Button type="button" onClick={onNewTrial}>
              New Trial
            </Button>
          </Link>
        </>
      }
    />
  );
}
