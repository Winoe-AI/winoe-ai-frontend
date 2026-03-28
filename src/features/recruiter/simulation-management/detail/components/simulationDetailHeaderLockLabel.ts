export function lockLabel(locked: boolean, lockedAt: string | null): string {
  if (!locked) return 'Unlocked';
  if (!lockedAt) return 'Locked';
  const parsed = new Date(lockedAt);
  if (Number.isNaN(parsed.getTime())) return 'Locked';
  return `Locked ${parsed.toLocaleDateString()}`;
}
