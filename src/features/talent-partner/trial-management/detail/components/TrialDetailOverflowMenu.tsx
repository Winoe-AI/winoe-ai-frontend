'use client';

import type { ReactNode } from 'react';
import { useEffect, useId, useRef, useState } from 'react';

type Props = {
  onEditDetails: () => void;
  onTerminate: () => void;
  terminatePending: boolean;
  trialTerminated: boolean;
  midMenuSlot?: ReactNode;
};

export function TrialDetailOverflowMenu({
  onEditDetails,
  onTerminate,
  terminatePending,
  trialTerminated,
  midMenuSlot,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div
      className="relative"
      ref={rootRef}
      data-testid="trial-detail-overflow-menu"
    >
      <button
        type="button"
        className="tp-no-print cursor-pointer rounded-md border border-subtle bg-elevated px-3 py-1.5 text-sm font-medium text-primary hover:bg-muted/40"
        aria-label="Trial actions menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="inline-flex items-center gap-1">
          More
          <span aria-hidden className="text-xs text-secondary">
            ▾
          </span>
        </span>
      </button>
      {open ? (
        <div
          id={menuId}
          className="absolute right-0 z-20 mt-1 min-w-[200px] rounded-md border border-subtle bg-elevated py-1 shadow-lg"
        >
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-sm text-primary hover:bg-muted/30"
            onClick={() => {
              onEditDetails();
              close();
            }}
          >
            Edit details
          </button>
          {midMenuSlot ? (
            <div className="border-t border-subtle">{midMenuSlot}</div>
          ) : null}
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-sm text-red-800 hover:bg-red-50"
            disabled={trialTerminated || terminatePending}
            onClick={() => {
              onTerminate();
              close();
            }}
          >
            Terminate Trial
          </button>
        </div>
      ) : null}
    </div>
  );
}
