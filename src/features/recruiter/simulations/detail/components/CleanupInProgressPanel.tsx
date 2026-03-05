'use client';

type Props = {
  cleanupJobIds: string[];
};

export function CleanupInProgressPanel({ cleanupJobIds }: Props) {
  if (!cleanupJobIds.length) return null;

  return (
    <div
      className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
      data-testid="cleanup-in-progress-panel"
    >
      <div className="font-medium">Cleanup in progress…</div>
      <p className="mt-1">
        Background cleanup jobs were started for this simulation. You can
        continue using the dashboard while cleanup finishes.
      </p>
      <p className="mt-2 text-xs text-amber-800">
        Job IDs: {cleanupJobIds.join(', ')}
      </p>
    </div>
  );
}
