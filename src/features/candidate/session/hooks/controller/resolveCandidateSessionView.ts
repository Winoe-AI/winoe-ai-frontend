import {
  hasScheduleConfigured,
  isScheduleLocked,
} from '../../utils/schedule';
import type { CandidateBootstrap } from '../../state/types';
import type { ViewState } from '../../views/types';

type Params = {
  view: ViewState;
  hasTaskData: boolean;
  bootstrap: CandidateBootstrap | null;
  scheduleResponseWindowCount: number;
  clockNowMs: number;
};

export function resolveCandidateSessionView({
  view,
  hasTaskData,
  bootstrap,
  scheduleResponseWindowCount,
  clockNowMs,
}: Params): ViewState {
  const resolvedView: ViewState =
    (view === 'loading' || view === 'starting') && hasTaskData
      ? 'running'
      : view;

  const hasSchedule =
    hasScheduleConfigured(bootstrap) ||
    (bootstrap?.scheduledStartAt != null &&
      bootstrap?.candidateTimezone != null &&
      scheduleResponseWindowCount > 0);

  const lockEligibleViews: ViewState[] = [
    'loading',
    'starting',
    'running',
    'scheduling',
    'scheduleConfirm',
    'scheduleSubmitting',
  ];

  const shouldKeepLocked =
    resolvedView !== 'locked' &&
    lockEligibleViews.includes(resolvedView) &&
    hasSchedule &&
    isScheduleLocked(
      {
        scheduledStartAt: bootstrap?.scheduledStartAt,
        candidateTimezone: bootstrap?.candidateTimezone,
        dayWindows: bootstrap?.dayWindows,
        currentDayWindow: bootstrap?.currentDayWindow ?? null,
      },
      clockNowMs,
    );

  return shouldKeepLocked ? 'locked' : resolvedView;
}
