'use client';
import type { ComponentType } from 'react';
import dynamic from 'next/dynamic';
import type { ScenarioControlsSectionProps } from './ScenarioControlsSection';

const LazyScenarioControlsSection = dynamic<ScenarioControlsSectionProps>(
  () =>
    import('./ScenarioControlsSection').then(
      (mod) => mod.ScenarioControlsSection,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="text-sm text-gray-600">
          Loading scenario controls...
        </div>
      </div>
    ),
  },
);

export let ScenarioControlsSectionComponent: ComponentType<ScenarioControlsSectionProps> =
  LazyScenarioControlsSection;

if (process.env.NODE_ENV === 'test') {
  const scenarioControlsModule =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('./ScenarioControlsSection') as typeof import('./ScenarioControlsSection');
  ScenarioControlsSectionComponent =
    scenarioControlsModule.ScenarioControlsSection;
}
