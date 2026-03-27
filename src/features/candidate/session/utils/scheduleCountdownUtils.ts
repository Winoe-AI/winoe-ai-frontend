export type CountdownParts = {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  complete: boolean;
};

function completedCountdown(): CountdownParts {
  return {
    totalMs: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    complete: true,
  };
}

export function countdownFromUtc(
  targetUtcIso: string | null | undefined,
  nowMs = Date.now(),
): CountdownParts {
  if (!targetUtcIso) return completedCountdown();
  const targetMs = Date.parse(targetUtcIso);
  if (!Number.isFinite(targetMs)) return completedCountdown();
  const remaining = Math.max(0, targetMs - nowMs);
  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);
  return {
    totalMs: remaining,
    days,
    hours,
    minutes,
    seconds,
    complete: remaining <= 0,
  };
}

export function formatCountdown(parts: CountdownParts): string {
  if (parts.complete) return 'Starting now';
  const hours = String(parts.hours).padStart(2, '0');
  const minutes = String(parts.minutes).padStart(2, '0');
  const seconds = String(parts.seconds).padStart(2, '0');
  return `${parts.days}d ${hours}h ${minutes}m ${seconds}s`;
}
