import { useMemo } from 'react';
import { useOptionalCandidateSession } from '../state/context';
import { AiNoticeCard } from '../components/AiNoticeCard';
import { SchedulingConfirmStep } from './SchedulingConfirmStep';
import { SchedulingFormStep } from './SchedulingFormStep';
import { SchedulingSubmitErrorBanner } from './SchedulingSubmitErrorBanner';
import type { SchedulingViewProps } from './SchedulingView.types';

export function SchedulingView({
  title,
  role,
  step,
  scheduleSubmitError,
  onScheduleRetry,
  ...rest
}: SchedulingViewProps) {
  const bootstrap = useOptionalCandidateSession()?.state.bootstrap ?? null;
  const showAiNotice = useMemo(
    () =>
      bootstrap
        ? Object.values(bootstrap.evalEnabledByDay ?? {}).some(Boolean)
        : true,
    [bootstrap],
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <div>
        <h1 className="text-lg font-semibold">Pick your start date</h1>
        <p className="mt-1 text-sm text-gray-600">
          Confirm your local schedule before starting{' '}
          {title || 'your simulation'}
          {role ? ` (${role})` : ''}.
        </p>
      </div>

      {showAiNotice ? (
        <AiNoticeCard
          compact
          version={bootstrap?.aiNoticeVersion}
          noticeText={bootstrap?.aiNoticeText}
        />
      ) : null}
      <SchedulingSubmitErrorBanner
        scheduleSubmitError={scheduleSubmitError}
        onScheduleRetry={onScheduleRetry}
      />
      {step === 'form' ? (
        <SchedulingFormStep
          scheduleDate={rest.scheduleDate}
          scheduleTimezone={rest.scheduleTimezone}
          scheduleTimezoneDetected={rest.scheduleTimezoneDetected}
          scheduleTimezoneOptions={rest.scheduleTimezoneOptions}
          scheduleDateError={rest.scheduleDateError}
          scheduleTimezoneError={rest.scheduleTimezoneError}
          onScheduleDateChange={rest.onScheduleDateChange}
          onScheduleTimezoneChange={rest.onScheduleTimezoneChange}
          onScheduleContinue={rest.onScheduleContinue}
          onDashboard={rest.onDashboard}
        />
      ) : (
        <SchedulingConfirmStep
          step={step}
          scheduleTimezone={rest.scheduleTimezone}
          schedulePreviewWindows={rest.schedulePreviewWindows}
          onScheduleBack={rest.onScheduleBack}
          onScheduleConfirm={rest.onScheduleConfirm}
        />
      )}
    </div>
  );
}
