const RECENT_TRIAL_IDS_KEY = 'winoe:recent-trial-ids';
const MAX_RECENT_TRIALS = 5;

function isClient() {
  return (
    typeof window !== 'undefined' &&
    typeof window.sessionStorage !== 'undefined'
  );
}

export function getRecentTrialIds(): string[] {
  if (!isClient()) return [];
  try {
    const raw = window.sessionStorage.getItem(RECENT_TRIAL_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === 'string');
  } catch {
    return [];
  }
}

export function rememberRecentTrialId(trialId: string) {
  if (!isClient()) return;
  const existing = getRecentTrialIds().filter((id) => id !== trialId);
  const next = [trialId, ...existing].slice(0, MAX_RECENT_TRIALS);
  window.sessionStorage.setItem(RECENT_TRIAL_IDS_KEY, JSON.stringify(next));
}
