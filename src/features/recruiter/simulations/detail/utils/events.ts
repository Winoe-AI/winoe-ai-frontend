export type SimulationDetailEventName =
  | 'approve_clicked'
  | 'regenerate_clicked'
  | 'retry_generate_clicked'
  | 'terminate_clicked'
  | 'terminate_confirmed'
  | 'terminate_success'
  | 'terminate_failure';

type EventPayload = {
  simulationId: string;
  status: string | null;
  scenarioVersion: number | null;
};

type AnalyticsLike = {
  track?: (name: string, payload?: Record<string, unknown>) => void;
};

export function logSimulationDetailEvent(
  name: SimulationDetailEventName,
  payload: EventPayload,
) {
  if (typeof window === 'undefined') return;

  const safePayload: Record<string, unknown> = {
    simulationId: payload.simulationId,
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
    new CustomEvent('tenon:simulation-detail-event', {
      detail: { event: name, ...safePayload },
    }),
  );
}
