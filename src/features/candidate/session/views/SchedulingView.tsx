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
          Choose when your 5-day Trial begins. Trial content unlocks only when
          Day 1 opens for {title || 'your Trial'}
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
          scheduleGithubUsername={rest.scheduleGithubUsername}
          scheduleTimezoneDetected={rest.scheduleTimezoneDetected}
          scheduleTimezoneOptions={rest.scheduleTimezoneOptions}
          scheduleDateError={rest.scheduleDateError}
          scheduleTimezoneError={rest.scheduleTimezoneError}
          scheduleGithubUsernameError={rest.scheduleGithubUsernameError}
          schedulePreviewWindows={rest.schedulePreviewWindows}
          scheduleCanContinue={rest.scheduleCanContinue}
          onScheduleDateChange={rest.onScheduleDateChange}
          onScheduleTimezoneChange={rest.onScheduleTimezoneChange}
          onScheduleGithubUsernameChange={rest.onScheduleGithubUsernameChange}
          onScheduleContinue={rest.onScheduleContinue}
          onDashboard={rest.onDashboard}
        />
      ) : (
        <SchedulingConfirmStep
          step={step}
          scheduleTimezone={rest.scheduleTimezone}
          scheduleGithubUsername={rest.scheduleGithubUsername}
          schedulePreviewWindows={rest.schedulePreviewWindows}
          onScheduleBack={rest.onScheduleBack}
          onScheduleConfirm={rest.onScheduleConfirm}
        />
      )}
    </div>
  );
}
