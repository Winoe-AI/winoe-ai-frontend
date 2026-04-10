'use client';
import { useEffect, useState } from 'react';

const DEFERRED_SCENARIO_CONTROLS_DELAY_MS =
  process.env.NODE_ENV === 'test' ? 0 : 450;

type WindowWithIdleCallbacks = Window & {
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions,
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

export function useDeferredScenarioControls() {
  const [showScenarioControls, setShowScenarioControls] = useState(
    DEFERRED_SCENARIO_CONTROLS_DELAY_MS === 0,
  );

  useEffect(() => {
    if (DEFERRED_SCENARIO_CONTROLS_DELAY_MS === 0 || showScenarioControls)
      return;
    let idleId: number | null = null;

    const timer = window.setTimeout(() => {
      const hostWindow = window as WindowWithIdleCallbacks;
      if (typeof hostWindow.requestIdleCallback === 'function') {
        idleId = hostWindow.requestIdleCallback(
          () => setShowScenarioControls(true),
          { timeout: 900 },
        );
        return;
      }
      setShowScenarioControls(true);
    }, DEFERRED_SCENARIO_CONTROLS_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      if (idleId !== null) {
        (window as WindowWithIdleCallbacks).cancelIdleCallback?.(idleId);
      }
    };
  }, [showScenarioControls]);

  return showScenarioControls;
}
