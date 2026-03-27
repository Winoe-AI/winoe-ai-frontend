'use client';

import { useCallback, useState } from 'react';

const DEFAULT_RESET_MS = 1200;

export function useClipboardFeedback() {
  const [copied, setCopied] = useState(false);

  const canCopy =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.clipboard) &&
    typeof navigator.clipboard.writeText === 'function';

  const copyText = useCallback(
    async (text: string | null) => {
      if (!canCopy || !text) return;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), DEFAULT_RESET_MS);
    },
    [canCopy],
  );

  return { canCopy, copied, copyText };
}
