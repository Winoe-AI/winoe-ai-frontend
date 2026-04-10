'use client';

import Link from 'next/link';
import Button from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';

type Props = {
  statusCode: 403 | 404;
};

export function TrialDetailBlockedState({ statusCode }: Props) {
  const content =
    statusCode === 404
      ? {
          title: 'Trial not found',
          description: 'This trial does not exist or may have been removed.',
        }
      : {
          title: 'Not authorized',
          description: "You don't have access to this trial.",
        };

  return (
    <div className="py-8">
      <EmptyState
        title={content.title}
        description={content.description}
        action={
          <Link href="/dashboard">
            <Button size="sm" variant="secondary">
              Back to dashboard
            </Button>
          </Link>
        }
      />
    </div>
  );
}
