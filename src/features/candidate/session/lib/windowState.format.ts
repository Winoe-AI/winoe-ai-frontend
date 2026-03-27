import type { TaskWindowClosedOverride } from './windowState.types';

export function formatLocalTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function formatLocalDateTime(
  iso: string | null | undefined,
): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function formatComeBackMessage(
  override: Pick<TaskWindowClosedOverride, 'nextOpenAt' | 'windowStartAt'>,
): string {
  const label = formatLocalDateTime(override.nextOpenAt ?? override.windowStartAt);
  if (label) return `This day is currently closed. Come back at ${label}.`;
  return 'This day is currently closed outside the scheduled window.';
}
