'use client';

import { useState } from 'react';
import Button from '@/shared/ui/Button';

type Props = {
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function TerminateSimulationModal({
  open,
  pending,
  onClose,
  onConfirm,
}: Props) {
  const [confirmed, setConfirmed] = useState(false);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terminate-simulation-title"
      data-testid="terminate-simulation-modal"
    >
      <div className="w-full max-w-xl rounded-lg border border-red-200 bg-white p-5 shadow-lg">
        <h2
          id="terminate-simulation-title"
          className="text-lg font-semibold text-gray-900"
        >
          Terminate simulation
        </h2>
        <p className="mt-2 text-sm text-gray-700">
          Terminating this simulation is destructive. Invites are disabled
          immediately, and cleanup jobs run asynchronously in the background.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
          <li>Invite and resend actions are blocked immediately.</li>
          <li>
            Resource cleanup is processed asynchronously and may complete later.
          </li>
          <li>You must explicitly confirm before proceeding.</li>
        </ul>

        <label className="mt-4 flex cursor-pointer items-start gap-2 rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            disabled={pending}
            className="mt-0.5 h-4 w-4"
            aria-label="confirm-terminate-simulation"
          />
          <span>
            I understand invites are disabled immediately and cleanup runs
            asynchronously.
          </span>
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="border-red-700 bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
            disabled={!confirmed || pending}
            loading={pending}
            onClick={onConfirm}
          >
            Terminate simulation
          </Button>
        </div>
      </div>
    </div>
  );
}
