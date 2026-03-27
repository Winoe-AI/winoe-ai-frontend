import Button from '@/shared/ui/Button';
import { DAY5_REFLECTION_MIN_SECTION_CHARS } from '../../utils/day5Reflection';

type Props = {
  displayStatus: string;
  submitting: boolean;
  submitDisabled: boolean;
  hasClientValidationErrors: boolean;
  onSaveDraft: () => void;
  onSubmitReflection: () => void;
};

export function Day5ReflectionActions({
  displayStatus,
  submitting,
  submitDisabled,
  hasClientValidationErrors,
  onSaveDraft,
  onSubmitReflection,
}: Props) {
  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onSaveDraft}
          className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-50"
          disabled={displayStatus !== 'idle' || submitting}
        >
          Save draft
        </button>
        <Button disabled={submitDisabled} onClick={onSubmitReflection}>
          {displayStatus === 'submitting'
            ? 'Submitting…'
            : displayStatus === 'submitted'
              ? 'Submitted ✓'
              : 'Submit & Continue'}
        </Button>
      </div>
      {hasClientValidationErrors ? (
        <p className="text-xs text-gray-600">
          Complete all sections with at least{' '}
          {String(DAY5_REFLECTION_MIN_SECTION_CHARS)} characters to submit.
        </p>
      ) : null}
    </div>
  );
}
