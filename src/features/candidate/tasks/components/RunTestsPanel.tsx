'use client';

import { useRunTests } from '../hooks/useRunTests';
import type { PollResult } from '../hooks/useRunTestsTypes';
import { RunTestsPanelHeader } from './RunTestsPanelHeader';
import { RunTestsPanelBody } from './RunTestsPanelBody';

type Props = {
  onStart: () => Promise<{ runId: string }>;
  onPoll: (runId: string) => Promise<PollResult>;
  storageKey?: string;
  pollIntervalMs?: number;
  maxAttempts?: number;
  maxPollIntervalMs?: number;
  maxDurationMs?: number;
  disabled?: boolean;
  disabledReason?: string | null;
};

export function RunTestsPanel(props: Props) {
  const {
    message,
    result,
    statusLabel,
    statusTone,
    ctaLabel: internalCta,
    disabled: internallyDisabled,
    startRun,
  } = useRunTests(props);
  const externallyDisabled = Boolean(props.disabled);
  const disabled = internallyDisabled || externallyDisabled;
  const ctaLabel = externallyDisabled ? 'Run tests unavailable' : internalCta;
  const handleStart = () => {
    if (externallyDisabled) return;
    void startRun();
  };

  return (
    <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
      <RunTestsPanelHeader
        onClick={handleStart}
        disabled={disabled}
        label={ctaLabel}
      />
      <RunTestsPanelBody
        message={message}
        statusLabel={statusLabel}
        statusTone={statusTone}
        result={result}
      />
      {externallyDisabled && props.disabledReason ? (
        <p className="mt-3 text-xs text-gray-600">{props.disabledReason}</p>
      ) : null}
    </div>
  );
}
