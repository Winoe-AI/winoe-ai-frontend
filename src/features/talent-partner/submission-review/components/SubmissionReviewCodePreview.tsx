'use client';

import { Highlight, themes } from 'prism-react-renderer';
import { InlineBadge } from '@/shared/ui/InlineBadge';
import type { SubmissionReviewCodeFile } from '../../api';

type Props = {
  file: SubmissionReviewCodeFile | null;
};

const PRISM_LANGUAGE_BY_FILE_LANGUAGE: Record<string, string> = {
  bash: 'bash',
  c: 'c',
  csharp: 'csharp',
  css: 'css',
  go: 'go',
  graphql: 'graphql',
  hcl: 'bash',
  html: 'markup',
  java: 'java',
  javascript: 'javascript',
  json: 'json',
  jsx: 'jsx',
  markdown: 'markdown',
  md: 'markdown',
  php: 'php',
  python: 'python',
  rb: 'ruby',
  rust: 'rust',
  sql: 'sql',
  shell: 'bash',
  sh: 'bash',
  text: 'text',
  ts: 'tsx',
  tsx: 'tsx',
  typescript: 'tsx',
  yaml: 'yaml',
  yml: 'yaml',
};

function resolvePrismLanguage(file: SubmissionReviewCodeFile): string {
  const rawLanguage = (file.language ?? '').trim().toLowerCase();
  if (rawLanguage && PRISM_LANGUAGE_BY_FILE_LANGUAGE[rawLanguage]) {
    return PRISM_LANGUAGE_BY_FILE_LANGUAGE[rawLanguage];
  }

  const extension = file.path.split('.').pop()?.toLowerCase() ?? '';
  if (extension && PRISM_LANGUAGE_BY_FILE_LANGUAGE[extension]) {
    return PRISM_LANGUAGE_BY_FILE_LANGUAGE[extension];
  }

  return 'tsx';
}

export function SubmissionReviewCodePreview({ file }: Props) {
  if (!file) {
    return (
      <div className="flex h-full min-h-[440px] items-center justify-center rounded-2xl border border-dashed border-subtle bg-secondary px-6 text-sm text-secondary">
        Select a file to inspect the candidate’s implementation.
      </div>
    );
  }

  const rawContent = file.content ?? '';
  if (!rawContent.trim()) {
    return (
      <div className="flex h-full min-h-[440px] items-center justify-center rounded-2xl border border-dashed border-subtle bg-secondary px-6 text-sm text-secondary">
        File content is unavailable for this artifact.
      </div>
    );
  }

  const lines = rawContent.split(/\r?\n/);
  const maxLines = 400;
  const visibleLines = lines.slice(0, maxLines);
  const truncated = lines.length > maxLines;

  return (
    <div
      className="overflow-hidden rounded-2xl border border-subtle bg-elevated"
      data-testid="submission-review-code-preview"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-subtle bg-secondary px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-primary">
            {file.name}
          </p>
          <p className="mt-1 text-xs text-secondary">
            {file.path}
            {file.language ? ` · ${file.language}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {file.changed ? <InlineBadge label="Changed" tone="warning" /> : null}
          <InlineBadge label={file.type} tone="muted" />
        </div>
      </div>
      <div className="max-h-[620px] overflow-auto">
        <Highlight
          code={visibleLines.join('\n')}
          language={resolvePrismLanguage(file) as never}
          theme={themes.github}
        >
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre
              className={`${className ?? ''} m-0 bg-transparent p-0 font-mono text-[13px] leading-6 text-primary`}
              style={{ ...style, background: 'transparent' }}
            >
              <div
                className="submission-review-code-preview__syntax"
                data-testid="submission-review-code-syntax"
              >
                {tokens.map((line, index) => {
                  const lineProps = getLineProps({ line, key: index });
                  return (
                    <div
                      {...lineProps}
                      key={`${file.path}-${index}`}
                      className="grid grid-cols-[4rem_minmax(0,1fr)] border-b border-transparent px-4"
                    >
                      <span className="select-none text-right text-xs text-tertiary">
                        {index + 1}
                      </span>
                      <code className="whitespace-pre-wrap break-words">
                        {line.map((token, tokenIndex) => (
                          <span
                            {...getTokenProps({ token, key: tokenIndex })}
                            key={`${file.path}-${index}-${tokenIndex}`}
                          />
                        ))}
                      </code>
                    </div>
                  );
                })}
              </div>
            </pre>
          )}
        </Highlight>
        {truncated ? (
          <div className="border-t border-subtle bg-secondary px-4 py-3 text-xs text-secondary">
            Large file truncated after {maxLines} lines to keep review
            responsive.
          </div>
        ) : null}
      </div>
    </div>
  );
}
