import type { ComponentType } from 'react';
import dynamic from 'next/dynamic';
import { LoadingView } from './views/LoadingView';
import type { RunningViewProps } from './views/RunningView';

const LazyRunningView = dynamic<RunningViewProps>(
  () => import('./views/RunningView').then((mod) => mod.RunningView),
  {
    ssr: false,
    loading: () => <LoadingView message="Loading your trial workspace." />,
  },
);

export let RunningViewComponent: ComponentType<RunningViewProps> =
  LazyRunningView;

if (process.env.NODE_ENV === 'test') {
  RunningViewComponent =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('./views/RunningView') as typeof import('./views/RunningView'))
      .RunningView;
}
