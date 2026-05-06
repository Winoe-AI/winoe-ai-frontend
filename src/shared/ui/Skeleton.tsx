import { cn } from './classnames';

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-secondary', className)}
      aria-hidden="true"
    />
  );
}
