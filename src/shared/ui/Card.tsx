import type { ReactNode } from 'react';
import { cn } from './classnames';

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-subtle bg-elevated p-4 shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  );
}
