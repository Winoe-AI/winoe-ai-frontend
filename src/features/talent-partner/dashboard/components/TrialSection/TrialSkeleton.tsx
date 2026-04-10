import { TableSkeleton } from '@/shared/ui/TableSkeleton';

export function TrialSkeleton() {
  return <TableSkeleton columns={4} rows={3} className="bg-white" />;
}
