import { StatusPill } from '@/shared/ui/StatusPill';
import { statusMeta } from '@/shared/status/statusMeta';

type TaskStatusProps = {
  displayStatus: 'idle' | 'submitting' | 'submitted';
  progress: { completed: number; total: number } | null;
  submittedLabel?: string | null;
  submittedShaLabel?: string | null;
  submittedSha?: string | null;
};

export function TaskStatus({
  displayStatus,
  progress,
  submittedLabel = null,
  submittedShaLabel = null,
  submittedSha = null,
}: TaskStatusProps) {
  if (displayStatus === 'idle') return <div className="mt-3 min-h-[20px]" />;

  const meta = statusMeta(displayStatus);
  const pillLabel =
    displayStatus === 'submitted' && submittedLabel
      ? submittedLabel
      : meta.label;
  const shortSha =
    submittedSha && submittedSha.length > 7
      ? submittedSha.slice(0, 7)
      : submittedSha;
  return (
    <div className="mt-3 flex min-h-[20px] items-center gap-2 text-sm text-gray-600">
      <StatusPill label={pillLabel} tone={meta.tone} />
      {displayStatus === 'submitted' && progress ? (
        <span>
          Progress: {progress.completed}/{progress.total}
        </span>
      ) : null}
      {displayStatus === 'submitted' && shortSha ? (
        <span className="text-xs text-gray-600">
          {(submittedShaLabel ?? 'Commit') + ': '}
          <span className="font-mono" title={submittedSha ?? undefined}>
            {shortSha}
          </span>
        </span>
      ) : null}
    </div>
  );
}
