'use client';

import { useState } from 'react';
import Button from '@/shared/ui/Button';

type Props = {
  loading: boolean;
  disabled?: boolean;
  currentVersionLabel: string;
  onConfirm: () => void;
};

export function RegenerateScenarioButton({
  loading,
  disabled,
  currentVersionLabel,
  onConfirm,
}: Props) {
  const [open, setOpen] = useState(false);

  const openModal = () => {
    if (loading || disabled) return;
    setOpen(true);
  };

  const closeModal = () => {
    if (loading) return;
    setOpen(false);
  };

  const confirm = () => {
    onConfirm();
    setOpen(false);
  };

  return (
    <>
      <Button
        onClick={openModal}
        size="sm"
        variant="secondary"
        loading={loading}
        disabled={disabled}
      >
        Regenerate scenario
      </Button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm scenario regenerate"
        >
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-4 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900">
              Regenerate scenario version?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              This will create a new scenario version from {currentVersionLabel}{' '}
              and start generation.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={closeModal}>
                Cancel
              </Button>
              <Button size="sm" onClick={confirm}>
                Regenerate
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
