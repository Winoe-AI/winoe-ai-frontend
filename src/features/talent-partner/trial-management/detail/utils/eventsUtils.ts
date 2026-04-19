export type TrialDetailEventName =
  | 'approve_clicked'
  | 'activate_clicked'
  | 'regenerate_clicked'
  | 'retry_generate_clicked'
  | 'terminate_clicked'
  | 'terminate_confirmed'
  | 'terminate_success'
  | 'terminate_failure'
  | 'activate_success'
  | 'activate_failure';

type EventPayload = {
  trialId: string;
  status: string | null;
  scenarioVersion: number | null;
};

type AnalyticsLike = {
  track?: (name: string, payload?: Record<string, unknown>) => void;
};

export function logTrialDetailEvent(
  name: TrialDetailEventName,
  payload: EventPayload,
) {
  if (typeof window === 'undefined') return;

  const safePayload: Record<string, unknown> = {
    trialId: payload.trialId,
    status: payload.status,
    scenarioVersion: payload.scenarioVersion,
  };

  const analytics = (window as Window & { analytics?: AnalyticsLike })
    .analytics;
  if (typeof analytics?.track === 'function') {
    analytics.track(name, safePayload);
    return;
  }

  window.dispatchEvent(
    new CustomEvent('winoe:trial-detail-event', {
      detail: { event: name, ...safePayload },
    }),
  );
}
