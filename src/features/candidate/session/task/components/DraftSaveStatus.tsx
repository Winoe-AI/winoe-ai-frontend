import type { TaskDraftAutosaveStatus } from '../hooks/useTaskDraftAutosave';

type Props = {
  status: TaskDraftAutosaveStatus;
  lastSavedAt: number | null;
  restoreApplied: boolean;
  error: string | null;
  className?: string;
};

function formatSavedAt(value: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function DraftSaveStatus({
  status,
  lastSavedAt,
  restoreApplied,
  error,
  className,
}: Props) {
  const parts: string[] = [];
  if (restoreApplied) parts.push('Draft restored');

  if (status === 'saving') {
    parts.push('Saving…');
  } else if (status === 'saved') {
    parts.push(
      lastSavedAt ? `Saved at ${formatSavedAt(lastSavedAt)}` : 'Saved',
    );
  } else if (status === 'error') {
    parts.push('Autosave failed. Keep editing to retry.');
  } else if (status === 'disabled' && error) {
    parts.push(error);
  }

  if (!parts.length) return null;

  return (
    <p
      aria-live="polite"
      className={className ?? 'text-xs font-medium text-gray-600'}
      title={status === 'error' && error ? error : undefined}
    >
      {parts.join(' • ')}
    </p>
  );
}
