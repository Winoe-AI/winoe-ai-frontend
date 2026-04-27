import { memo, useState } from 'react';
import Button from '@/shared/ui/Button';

type TaskActionsProps = {
  isTextTask: boolean;
  displayStatus: 'idle' | 'submitting' | 'submitted';
  disabled: boolean;
  disabledReason?: string | null;
  onSaveDraft?: () => void;
  onSubmit: () => void | Promise<unknown>;
  requireSubmitConfirmation?: boolean;
};

export const TaskActions = memo(function TaskActions({
  isTextTask,
  displayStatus,
  disabled,
  disabledReason,
  onSaveDraft,
  onSubmit,
  requireSubmitConfirmation = false,
}: TaskActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmPending, setConfirmPending] = useState(false);
  const submitLabel =
    displayStatus === 'submitting'
      ? 'Submitting…'
      : displayStatus === 'submitted'
        ? 'Submitted ✓'
        : 'Submit & Continue';
  const handleSubmitClick = () => {
    if (disabled || displayStatus !== 'idle') return;
    if (requireSubmitConfirmation) {
      setConfirmOpen(true);
      return;
    }
    onSubmit();
  };
  const handleConfirm = () => {
    if (confirmPending || disabled || displayStatus !== 'idle') return;
    setConfirmPending(true);
    setConfirmOpen(false);
    Promise.resolve(onSubmit()).finally(() => {
      setConfirmPending(false);
    });
  };

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        {isTextTask ? (
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={disabled}
            className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            Save draft
          </button>
        ) : (
          <div />
        )}

        <Button onClick={handleSubmitClick} disabled={disabled}>
          {submitLabel}
        </Button>
      </div>
      {disabled && disabledReason ? (
        <p className="text-xs text-gray-600">{disabledReason}</p>
      ) : null}
      {confirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="submit-day1-confirm-title"
            className="w-full max-w-md rounded-md bg-white p-5 shadow-xl"
          >
            <h2
              id="submit-day1-confirm-title"
              className="text-lg font-semibold text-gray-950"
            >
              Submit Day 1 design document?
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-700">
              Final submission locks this Day 1 design document. Winoe AI will
              use it in the Evidence Trail for this Trial.
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
                  confirmPending || disabled || displayStatus !== 'idle'
                }
                onClick={handleConfirm}
              >
                Submit and lock
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
});
