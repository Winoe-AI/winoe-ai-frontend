import Button from '@/shared/ui/Button';

type Props = {
  dayIndex: number;
  loading: boolean;
  refreshing: boolean;
  readOnly: boolean;
  onRefresh: () => void;
};

export function WorkspacePanelHeader({
  dayIndex,
  loading,
  refreshing,
  readOnly,
  onRefresh,
}: Props) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-sm font-semibold text-gray-900">
          Day {dayIndex} workspace
        </div>
        <div className="text-xs text-gray-600">
          {readOnly
            ? 'Workspace actions are paused while this day is closed.'
            : 'Provisioned GitHub repo + Codespace link.'}
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
