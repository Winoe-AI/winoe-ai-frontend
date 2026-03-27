import Button from '@/shared/ui/Button';
import Input from '@/shared/ui/Input';
import type { SchedulingViewProps } from './SchedulingView.types';

type SchedulingFormStepProps = Pick<
  SchedulingViewProps,
  | 'scheduleDate'
  | 'scheduleTimezone'
  | 'scheduleTimezoneDetected'
  | 'scheduleTimezoneOptions'
  | 'scheduleDateError'
  | 'scheduleTimezoneError'
  | 'onScheduleDateChange'
  | 'onScheduleTimezoneChange'
  | 'onScheduleContinue'
  | 'onDashboard'
>;

export function SchedulingFormStep({
  scheduleDate,
  scheduleTimezone,
  scheduleTimezoneDetected,
  scheduleTimezoneOptions,
  scheduleDateError,
  scheduleTimezoneError,
  onScheduleDateChange,
  onScheduleTimezoneChange,
  onScheduleContinue,
  onDashboard,
}: SchedulingFormStepProps) {
  return (
    <div className="space-y-4 rounded-md border border-gray-200 p-4">
      <label className="block text-sm font-medium text-gray-800">
        Start date
      </label>
      <Input
        type="date"
        value={scheduleDate}
        onChange={(event) => onScheduleDateChange(event.target.value)}
        aria-label="Start date"
      />
      {scheduleDateError ? (
        <p className="text-sm text-red-700">{scheduleDateError}</p>
      ) : null}

      <label className="block text-sm font-medium text-gray-800">
        Timezone (IANA)
      </label>
      <Input
        type="text"
        value={scheduleTimezone}
        list="candidate-timezone-list"
        onChange={(event) => onScheduleTimezoneChange(event.target.value)}
        placeholder="America/New_York"
        aria-label="Timezone"
      />
      <datalist id="candidate-timezone-list">
        {scheduleTimezoneOptions.map((timezoneOption) => (
          <option key={timezoneOption} value={timezoneOption} />
        ))}
      </datalist>
      {scheduleTimezoneDetected ? (
        <p className="text-xs text-gray-500">
          Detected timezone: {scheduleTimezoneDetected}
        </p>
      ) : (
        <p className="text-xs text-gray-500">
          We could not detect your timezone. Enter it manually.
        </p>
      )}
      {scheduleTimezoneError ? (
        <p className="text-sm text-red-700">{scheduleTimezoneError}</p>
      ) : null}

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onDashboard}>
          Back to dashboard
        </Button>
        <Button onClick={onScheduleContinue}>Continue</Button>
      </div>
    </div>
  );
}
