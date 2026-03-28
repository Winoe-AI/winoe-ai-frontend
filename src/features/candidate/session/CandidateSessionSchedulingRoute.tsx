import { SchedulingView } from './views/SchedulingView';
import type {
  CandidateSessionViewProps as Props,
  ViewState,
} from './views/types';

type CandidateSessionSchedulingRouteProps = {
  props: Props;
  view: ViewState;
};

export function CandidateSessionSchedulingRoute({
  props,
  view,
}: CandidateSessionSchedulingRouteProps) {
  if (
    view !== 'scheduling' &&
    view !== 'scheduleConfirm' &&
    view !== 'scheduleSubmitting'
  ) {
    return null;
  }

  return (
    <SchedulingView
      title={props.title}
      role={props.role}
      step={
        view === 'scheduling'
          ? 'form'
          : view === 'scheduleSubmitting'
            ? 'submitting'
            : 'confirm'
      }
      scheduleDate={props.scheduleDate}
      scheduleTimezone={props.scheduleTimezone}
      scheduleTimezoneDetected={props.scheduleTimezoneDetected}
      scheduleTimezoneOptions={props.scheduleTimezoneOptions}
      scheduleDateError={props.scheduleDateError}
      scheduleTimezoneError={props.scheduleTimezoneError}
      scheduleSubmitError={props.scheduleSubmitError}
      schedulePreviewWindows={props.schedulePreviewWindows}
      onScheduleDateChange={props.onScheduleDateChange}
      onScheduleTimezoneChange={props.onScheduleTimezoneChange}
      onScheduleContinue={props.onScheduleContinue}
      onScheduleBack={props.onScheduleBack}
      onScheduleConfirm={props.onScheduleConfirm}
      onScheduleRetry={props.onScheduleRetry}
      onDashboard={props.onDashboard}
    />
  );
}
