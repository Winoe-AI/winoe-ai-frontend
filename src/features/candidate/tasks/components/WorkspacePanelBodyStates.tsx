import Button from '@/shared/ui/Button';
import { Skeleton } from '@/shared/ui/Skeleton';

type WorkspacePanelErrorStateProps = {
  error: string;
  onRefresh: () => void;
  refreshing: boolean;
  readOnly: boolean;
};

export function WorkspacePanelLoadingState() {
  return (
    <div className="mt-4 space-y-2 text-sm text-gray-600">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-3 w-56 bg-gray-100" />
      <Skeleton className="h-3 w-48 bg-gray-100" />
    </div>
  );
}

export function WorkspacePanelErrorState({
  error,
  onRefresh,
  refreshing,
  readOnly,
}: WorkspacePanelErrorStateProps) {
  return (
    <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      <div>{error}</div>
      <div className="mt-2 flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={onRefresh}
          disabled={readOnly || refreshing}
        >
          {refreshing ? 'Refreshing…' : 'Retry'}
        </Button>
      </div>
    </div>
  );
}
