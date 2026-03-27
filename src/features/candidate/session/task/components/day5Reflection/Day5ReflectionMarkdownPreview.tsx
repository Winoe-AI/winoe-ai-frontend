import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { MarkdownPreviewProps } from '@/shared/ui/Markdown';

const LazyMarkdownPreview = dynamic(
  () => import('@/shared/ui/Markdown').then((m) => m.MarkdownPreview),
  {
    loading: () => (
      <div className="text-xs text-gray-500" aria-label="loading-markdown">
        Loading preview…
      </div>
    ),
    ssr: false,
  },
);

let Day5ReflectionMarkdownPreview: ComponentType<MarkdownPreviewProps> =
  LazyMarkdownPreview;

if (process.env.NODE_ENV === 'test') {
  const mod =
    require('@/shared/ui/Markdown') as typeof import('@/shared/ui/Markdown'); // eslint-disable-line @typescript-eslint/no-require-imports
  Day5ReflectionMarkdownPreview = mod.MarkdownPreview;
}

export { Day5ReflectionMarkdownPreview };
