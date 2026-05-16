'use client';

import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { cn } from './classnames';
import { sanitizeMarkdownUrl } from './Markdown';

export type MarkdownRendererProps = {
  content: string | null | undefined;
  className?: string;
  emptyPlaceholder?: ReactNode;
  variant?: 'default' | 'reading';
};

const readingClassName =
  'markdown-reading max-w-[720px] font-sans text-base leading-[1.6] text-primary ' +
  '[&_h1]:mb-4 [&_h1]:mt-0 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-tight ' +
  '[&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 ' +
  '[&_h3]:text-lg [&_h3]:font-semibold [&_p]:my-4 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 ' +
  '[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1.5 ' +
  '[&_code]:rounded-md [&_code]:bg-elevated [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono ' +
  '[&_code]:text-[0.9em] [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border ' +
  '[&_pre]:border-subtle [&_pre]:bg-elevated [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm ' +
  '[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm ' +
  '[&_th]:border [&_th]:border-subtle [&_th]:bg-secondary [&_th]:px-3 [&_th]:py-2 [&_th]:text-left ' +
  '[&_td]:border [&_td]:border-subtle [&_td]:px-3 [&_td]:py-2 [&_blockquote]:my-4 ' +
  '[&_blockquote]:border-l-4 [&_blockquote]:border-wheat-500/40 [&_blockquote]:pl-4 ' +
  '[&_blockquote]:text-secondary [&_a]:text-wheat-700 [&_a]:underline';

const defaultClassName =
  'markdown-content text-sm leading-6 text-primary [&_h1]:mb-3 [&_h1]:mt-0 [&_h1]:text-xl ' +
  '[&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold ' +
  '[&_h3]:mt-3 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_p]:my-2 [&_ul]:my-2 ' +
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 ' +
  '[&_code]:rounded [&_code]:bg-secondary [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono ' +
  '[&_pre]:overflow-auto [&_pre]:rounded [&_pre]:bg-elevated [&_pre]:p-3 [&_pre]:font-mono ' +
  '[&_pre]:text-sm [&_blockquote]:border-l-4 [&_blockquote]:border-subtle ' +
  '[&_blockquote]:pl-3 [&_a]:text-wheat-700 [&_a]:underline';

export function MarkdownRenderer({
  content,
  className,
  emptyPlaceholder,
  variant = 'default',
}: MarkdownRendererProps) {
  const safeContent = typeof content === 'string' ? content : '';

  if (!safeContent.trim()) {
    return (
      <div className={cn('text-sm text-secondary', className)}>
        {emptyPlaceholder ?? 'Nothing to show yet.'}
      </div>
    );
  }

  return (
    <div
      className={cn(
        variant === 'reading' ? readingClassName : defaultClassName,
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        skipHtml
        urlTransform={sanitizeMarkdownUrl}
      >
        {safeContent}
      </ReactMarkdown>
    </div>
  );
}
