import PageHeader from '@/shared/ui/PageHeader';
import Button from '@/shared/ui/Button';
import Link from 'next/link';

type DashboardHeaderProps = {
  onNewSimulation?: () => void;
};

const LINK_PREFETCH = process.env.NODE_ENV === 'test' ? undefined : false;

export function DashboardHeader({ onNewSimulation }: DashboardHeaderProps) {
  return (
    <PageHeader
      title="Dashboard"
      actions={
        <Link href="/dashboard/simulations/new" prefetch={LINK_PREFETCH}>
          <Button type="button" onClick={onNewSimulation}>
            New Simulation
          </Button>
        </Link>
      }
    />
  );
}
