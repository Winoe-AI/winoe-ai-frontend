'use client';

import { useEffect, useMemo, useState } from 'react';
import Button from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { PromptOverrideEditors } from '@/features/recruiter/ai/PromptOverrideEditors';
import {
  buildPromptOverrideFormValues,
  buildPromptOverridePayload,
} from '@/features/recruiter/ai/promptOverrideFormUtils';
import { updateSimulationAiConfig } from '@/features/recruiter/api';
import type { SimulationAiConfig } from '@/features/recruiter/api';

type Props = {
  simulationId: string;
  aiConfig: SimulationAiConfig;
  onSaved: () => Promise<void> | void;
};

export function SimulationAiOverridesPanel({
  simulationId,
  aiConfig,
  onSaved,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState(() =>
    buildPromptOverrideFormValues(aiConfig.promptOverrides),
  );

  useEffect(() => {
    setValues(buildPromptOverrideFormValues(aiConfig.promptOverrides));
    setError(null);
  }, [aiConfig.promptOverrides, simulationId]);

  const enabledDaysLabel = useMemo(() => {
    const enabledDays = Object.entries(aiConfig.evalEnabledByDay)
      .filter(([, enabled]) => enabled)
      .map(([day]) => `Day ${day}`);
    return enabledDays.length > 0 ? enabledDays.join(', ') : 'None';
  }, [aiConfig.evalEnabledByDay]);
  const activeSnapshot = aiConfig.activeScenarioSnapshot ?? null;
  const pendingSnapshot = aiConfig.pendingScenarioSnapshot ?? null;

  return (
    <Card className="space-y-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            Simulation AI overrides
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            These prompts and rubrics apply only to this simulation and replace
            any company default for the same agent.
          </p>
        </div>
        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
          <div>Notice version: {aiConfig.noticeVersion}</div>
          <div className="mt-1">AI scoring days: {enabledDaysLabel}</div>
          <div className="mt-1">
            Prompt pack: {aiConfig.promptPackVersion ?? 'unknown'}
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-md border border-gray-200 bg-white p-3 text-xs text-gray-700">
          <div className="font-semibold text-gray-900">Active frozen snapshot</div>
          <div className="mt-2">
            Scenario version:{' '}
            {activeSnapshot?.scenarioVersionId ?? 'Not generated yet'}
          </div>
          <div className="mt-1">
            Snapshot digest:{' '}
            {activeSnapshot?.snapshotDigest ?? 'Missing'}
          </div>
          <div className="mt-1">
            Bundle status: {activeSnapshot?.bundleStatus ?? 'n/a'}
          </div>
          <div className="mt-1">
            Drift from current edits:{' '}
            {aiConfig.changesPendingRegeneration ? 'Yes' : 'No'}
          </div>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-3 text-xs text-gray-700">
          <div className="font-semibold text-gray-900">Pending snapshot</div>
          <div className="mt-2">
            Scenario version:{' '}
            {pendingSnapshot?.scenarioVersionId ?? 'None'}
          </div>
          <div className="mt-1">
            Snapshot digest:{' '}
            {pendingSnapshot?.snapshotDigest ?? 'None'}
          </div>
          <div className="mt-1">
            Bundle status: {pendingSnapshot?.bundleStatus ?? 'n/a'}
          </div>
          <div className="mt-1">
            Current changes take effect only after scenario regeneration and
            approval.
          </div>
        </div>
      </div>

      {activeSnapshot?.agents?.length ? (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
          <div className="font-semibold text-gray-900">Frozen agent runtime</div>
          <div className="mt-2 grid gap-2 lg:grid-cols-2">
            {activeSnapshot.agents.map((agent) => (
              <div
                key={agent.key}
                className="rounded border border-gray-200 bg-white p-2"
              >
                <div className="font-medium text-gray-900">{agent.key}</div>
                <div className="mt-1">
                  {agent.provider ?? 'unknown'} / {agent.model ?? 'unknown'}
                </div>
                <div className="mt-1">
                  Runtime: {agent.runtimeMode ?? 'unknown'}
                </div>
                <div className="mt-1">
                  Prompt: {agent.promptVersion ?? 'unknown'}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {error ? (
        <div
          className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <PromptOverrideEditors
        values={values}
        disabled={saving}
        onChange={(key, field, value) =>
          setValues((prev) => ({
            ...prev,
            [key]: {
              ...prev[key],
              [field]: value,
            },
          }))
        }
      />

      <div className="flex justify-end">
        <Button
          type="button"
          loading={saving}
          onClick={() => {
            void (async () => {
              setSaving(true);
              setError(null);
              try {
                await updateSimulationAiConfig(simulationId, {
                  promptOverrides: buildPromptOverridePayload(values, {
                    includeNullKeys: true,
                  }),
                });
                await onSaved();
              } catch (caught: unknown) {
                setError(
                  caught instanceof Error
                    ? caught.message
                    : 'Unable to save simulation AI overrides right now.',
                );
              } finally {
                setSaving(false);
              }
            })();
          }}
        >
          Save simulation overrides
        </Button>
      </div>
    </Card>
  );
}
