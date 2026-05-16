'use client';

import { ReactNode, useEffect, useId, useRef, useState } from 'react';
import Button from '@/shared/ui/Button';
import { cn } from '@/shared/ui/classnames';

type ModalShellProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  widthClassName?: string;
};

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      [
        'button:not([disabled])',
        '[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(','),
    ),
  );
}

export function ModalShell({
  open,
  title,
  onClose,
  children,
  widthClassName = 'max-w-[640px]',
}: ModalShellProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [present, setPresent] = useState(open);
  const [entered, setEntered] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (open) {
      const frame = requestAnimationFrame(() => {
        setPresent(true);
        setEntered(true);
      });
      return () => cancelAnimationFrame(frame);
    }
    const timeout = window.setTimeout(() => {
      setEntered(false);
      setPresent(false);
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previousActiveElement = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
      if (event.key !== 'Tab') return;

      const focusables = getFocusableElements(dialogRef.current);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (
          !active ||
          !dialogRef.current?.contains(active) ||
          active === first
        ) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (!active || !dialogRef.current?.contains(active) || active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    queueMicrotask(() => {
      const focusables = getFocusableElements(dialogRef.current);
      (focusables[0] ?? dialogRef.current)?.focus?.();
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (
        previousActiveElement &&
        typeof previousActiveElement.focus === 'function'
      ) {
        previousActiveElement.focus();
      }
    };
  }, [onClose, open]);

  if (!present) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className={cn(
          'absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200',
          entered ? 'opacity-100' : 'opacity-0',
        )}
        aria-hidden="true"
        onClick={onClose}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'absolute right-4 top-4 bottom-4 w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-subtle bg-elevated shadow-2xl transition-[opacity,transform] duration-200 ease-out md:right-6 md:top-6 md:bottom-6',
          widthClassName,
          entered ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0',
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-subtle px-6 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary">
                Winoe Report
              </p>
              <h3
                id={titleId}
                className="mt-1 text-xl font-semibold tracking-tight text-primary"
              >
                {title}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label={`Close ${title}`}
            >
              Close
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
