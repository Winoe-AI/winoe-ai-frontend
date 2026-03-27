'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type {
  Day5ReflectionPanelProps,
  HandoffUploadPanelProps,
} from './CandidateTaskView.types';

const LazyDay5ReflectionPanel = dynamic(
  () =>
    import('./components/Day5ReflectionPanel').then(
      (mod) => mod.Day5ReflectionPanel,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-600">
        Loading reflection panel...
      </div>
    ),
  },
);

const LazyHandoffUploadPanel = dynamic(
  () =>
    import('./handoff/HandoffUploadPanel').then(
      (mod) => mod.HandoffUploadPanel,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-600">
        Loading upload panel...
      </div>
    ),
  },
);

export let Day5ReflectionPanelComponent: ComponentType<Day5ReflectionPanelProps> =
  LazyDay5ReflectionPanel;
export let HandoffUploadPanelComponent: ComponentType<HandoffUploadPanelProps> =
  LazyHandoffUploadPanel;

if (process.env.NODE_ENV === 'test') {
  const day5Module =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('./components/Day5ReflectionPanel') as typeof import('./components/Day5ReflectionPanel');
  Day5ReflectionPanelComponent = day5Module.Day5ReflectionPanel;
  const handoffModule =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('./handoff/HandoffUploadPanel') as typeof import('./handoff/HandoffUploadPanel');
  HandoffUploadPanelComponent = handoffModule.HandoffUploadPanel;
}
