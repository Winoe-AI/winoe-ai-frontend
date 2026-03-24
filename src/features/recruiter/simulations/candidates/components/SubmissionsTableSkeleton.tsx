'use client';
import { TableSkeleton } from '@/shared/ui/TableSkeleton';

export function SubmissionsTableSkeleton() {
  return (
    <div className="rounded border border-gray-200 bg-white p-4">
      <div className="mb-3 h-5 w-44 rounded bg-gray-100" />
      <div className="min-h-[420px]">
        <TableSkeleton columns={5} rows={6} className="bg-white" />
      </div>
    </div>
  );
}
