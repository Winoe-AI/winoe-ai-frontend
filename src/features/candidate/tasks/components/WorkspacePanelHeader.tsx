import Button from '@/shared/ui/Button';

type Props = {
  loading: boolean;
  refreshing: boolean;
  readOnly: boolean;
  onRefresh: () => void;
};

export function WorkspacePanelHeader({
  loading,
  refreshing,
  readOnly,
  onRefresh,
}: Props) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-sm font-semibold text-gray-900">
          Coding workspace
        </div>
        <div className="text-xs text-gray-600">
          {readOnly
            ? 'Workspace actions are paused while this day is closed.'
            : 'Day 2 and Day 3 open in GitHub Codespaces only.'}
        </div>
      </div>
      <Button
        variant="secondary"
        onClick={onRefresh}
        disabled={readOnly || loading || refreshing}
      >
        {refreshing ? 'Refreshing…' : 'Refresh'}
      </Button>
    </div>
  );
}
