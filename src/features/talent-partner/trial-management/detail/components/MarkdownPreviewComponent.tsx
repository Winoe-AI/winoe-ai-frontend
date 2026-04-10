'use client';

import type { ComponentType } from 'react';
import { LazyMarkdownPreview } from '@/shared/ui/LazyMarkdownPreview';
import type { MarkdownPreviewProps } from '@/shared/ui/Markdown';

let MarkdownPreviewComponent: ComponentType<MarkdownPreviewProps> =
  LazyMarkdownPreview;

if (process.env.NODE_ENV === 'test') {
  MarkdownPreviewComponent =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('@/shared/ui/Markdown') as typeof import('@/shared/ui/Markdown'))
      .MarkdownPreview;
}

export { MarkdownPreviewComponent };
