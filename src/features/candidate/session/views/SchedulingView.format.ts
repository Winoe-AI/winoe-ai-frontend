export const SCHEDULE_DAY_LABELS: Record<number, string> = {
  1: 'Planning & Design Doc',
  2: 'Implementation Kickoff',
  3: 'Implementation Wrap-Up',
  4: 'Handoff + Demo',
  5: 'Reflection Essay',
};

export function formatScheduleDate(iso: string, timezone: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

export function formatScheduleTime(iso: string, timezone: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '9:00 AM';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed);
}

export function formatScheduleTimeRange(
  startIso: string,
  endIso: string,
  timezone: string,
): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return '9:00 AM - 5:00 PM';
  }
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${formatter.format(start)} - ${formatter.format(end)}`;
}
