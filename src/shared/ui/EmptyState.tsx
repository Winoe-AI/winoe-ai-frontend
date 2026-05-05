'use client';

import type { ReactNode } from 'react';

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-md border border-subtle bg-elevated p-4 text-sm text-secondary">
      <div className="text-base font-semibold text-primary">{title}</div>
      <div className="mt-1 text-sm text-tertiary">{description}</div>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
