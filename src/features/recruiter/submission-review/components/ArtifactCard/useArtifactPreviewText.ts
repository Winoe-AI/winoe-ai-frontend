import { useMemo } from 'react';

export function useArtifactPreviewText(
  contentText: string | null | undefined,
  hasText: boolean,
  expanded: boolean,
): string | null {
  return useMemo(() => {
    if (!hasText || typeof contentText !== 'string') return null;
    const text = contentText.trim();
    if (expanded || text.length <= 300) return text;
    return `${text.slice(0, 300)}…`;
  }, [contentText, expanded, hasText]);
}
