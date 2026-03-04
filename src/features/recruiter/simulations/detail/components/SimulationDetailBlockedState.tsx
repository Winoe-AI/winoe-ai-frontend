'use client';

import Link from 'next/link';
import Button from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';

type Props = {
  statusCode: 403 | 404;
};

export function SimulationDetailBlockedState({ statusCode }: Props) {
  const content =
    statusCode === 404
      ? {
          title: 'Simulation not found',
          description:
            'This simulation does not exist or may have been removed.',
        }
      : {
          title: 'Not authorized',
          description: "You don't have access to this simulation.",
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
