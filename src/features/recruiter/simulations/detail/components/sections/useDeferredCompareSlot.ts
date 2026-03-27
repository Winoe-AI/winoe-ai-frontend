import { useEffect, useState } from 'react';

const DEFERRED_COMPARE_DELAY_MS = process.env.NODE_ENV === 'test' ? 0 : 550;

type WindowWithIdleCallbacks = Window & {
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions,
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

export function useDeferredCompareSlot(compareEnabled: boolean) {
  const [showCompareSlot, setShowCompareSlot] = useState(
    DEFERRED_COMPARE_DELAY_MS === 0 || !compareEnabled,
  );

  useEffect(() => {
    if (DEFERRED_COMPARE_DELAY_MS === 0 || !compareEnabled || showCompareSlot) {
      return;
    }
    let idleId: number | null = null;
    const timer = window.setTimeout(() => {
      const hostWindow = window as WindowWithIdleCallbacks;
      if (typeof hostWindow.requestIdleCallback === 'function') {
        idleId = hostWindow.requestIdleCallback(
          () => setShowCompareSlot(true),
          { timeout: 1000 },
        );
        return;
      }
      setShowCompareSlot(true);
    }, DEFERRED_COMPARE_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      if (idleId !== null) {
        (window as WindowWithIdleCallbacks).cancelIdleCallback?.(idleId);
      }
    };
  }, [compareEnabled, showCompareSlot]);

  return showCompareSlot;
}
