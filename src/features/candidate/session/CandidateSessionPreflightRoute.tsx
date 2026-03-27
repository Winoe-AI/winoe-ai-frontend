import { AuthView } from './views/AuthView';
import { LoadingView } from './views/LoadingView';
import { LockedView } from './views/LockedView';
import type { CandidateSessionViewProps as Props } from './views/types';
import { CandidateSessionAccessRoute } from './CandidateSessionAccessRoute';
import { CandidateSessionErrorRoute } from './CandidateSessionErrorRoute';
import { CandidateSessionSchedulingRoute } from './CandidateSessionSchedulingRoute';

type CandidateSessionPreflightRouteProps = {
  props: Props;
};

export function CandidateSessionPreflightRoute({
  props,
}: CandidateSessionPreflightRouteProps) {
  const {
    view,
    authStatus,
    authMessage,
    errorMessage,
    errorStatus,
    inviteErrorCopy,
  } = props;

  if (view === 'loading') {
    return <LoadingView message="Checking your invite and signing you in." />;
  }
  if (view === 'auth') {
    return <AuthView loginHref={props.loginHref} message={authMessage} />;
  }
  if (view === 'starting') {
    return <LoadingView message="Loading your tasks and workspace." />;
  }

  const accessRoute = CandidateSessionAccessRoute({ props, view, errorMessage });
  if (accessRoute) return accessRoute;

  const scheduleRoute = CandidateSessionSchedulingRoute({ props, view });
  if (scheduleRoute) return scheduleRoute;

  if (view === 'locked') {
    return (
      <LockedView
        title={props.title}
        role={props.role}
        countdownLabel={props.scheduleCountdownLabel}
        countdownTargetAt={props.scheduleCountdownTargetAt}
        timezone={props.scheduleDisplayTimezone}
        scheduledStartAt={props.scheduleDisplayStartAt}
        dayWindows={props.scheduleResponseWindows}
        currentDayWindow={props.scheduleCurrentDayWindow}
        errorMessage={props.scheduleSubmitError}
        onRetry={props.onRefreshScheduleLock}
      />
    );
  }

  if (view === 'error') {
    return CandidateSessionErrorRoute({
      props,
      authStatus,
      errorMessage,
      errorStatus,
      inviteErrorCopy,
    });
  }

  return null;
}
