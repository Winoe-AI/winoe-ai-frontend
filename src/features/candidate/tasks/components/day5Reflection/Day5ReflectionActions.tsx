import { useState } from 'react';
import Button from '@/shared/ui/Button';

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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmPending, setConfirmPending] = useState(false);
  const submitLabel =
    displayStatus === 'submitting'
      ? 'Submitting…'
      : displayStatus === 'submitted'
        ? 'Submitted ✓'
        : 'Submit Reflection Essay';

  const handleSubmitClick = () => {
    if (displayStatus !== 'idle' || submitDisabled || submitting) return;
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = () => {
    if (
      confirmPending ||
      displayStatus !== 'idle' ||
      submitDisabled ||
      submitting
    )
      return;
    setConfirmPending(true);
    setConfirmOpen(false);
    Promise.resolve(onSubmitReflection()).finally(() => {
      setConfirmPending(false);
    });
  };

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
        <Button
          disabled={submitDisabled || displayStatus !== 'idle'}
          onClick={handleSubmitClick}
        >
          {submitLabel}
        </Button>
      </div>
      {hasClientValidationErrors ? (
        <p className="text-xs text-gray-600">
          Add reflection text before submitting.
        </p>
      ) : null}
      {confirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="submit-day5-confirm-title"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2
              id="submit-day5-confirm-title"
              className="text-lg font-semibold text-gray-950"
            >
              Submit your Reflection Essay?
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-700">
              This will complete Day 5 and mark your active Trial as finished.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={confirmPending}
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={
                  confirmPending || submitDisabled || displayStatus !== 'idle'
                }
                onClick={handleConfirmSubmit}
              >
                Submit Reflection Essay
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
