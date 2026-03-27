'use client';

import Link from 'next/link';
import Button from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import type { SimulationListItem } from '@/features/recruiter/api';
import { SimulationListRow } from './SimulationListRow';
import { LINK_PREFETCH, useSimulationListPrefetch } from './simulationListPrefetch';

type RecruiterSimulationListProps = {
  simulations: SimulationListItem[];
  onInvite: (sim: SimulationListItem) => void;
};

export function RecruiterSimulationList({
  simulations,
  onInvite,
}: RecruiterSimulationListProps) {
  const prefetchSimulation = useSimulationListPrefetch(simulations);

  if (!simulations.length) {
    return (
      <EmptyState
        title="No simulations yet"
        description="Kick off a simulation to invite candidates and track their progress."
        action={
          <Link href="/dashboard/simulations/new" prefetch={LINK_PREFETCH}>
            <Button>New Simulation</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="rounded border border-gray-200">
      <div className="grid grid-cols-12 gap-3 border-b border-gray-200 bg-gray-50 p-3 text-xs font-medium uppercase tracking-wide text-gray-500">
        <div className="col-span-4">Title</div>
        <div className="col-span-3">Role</div>
        <div className="col-span-3">Created</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {simulations.map((sim) => (
        <SimulationListRow
          key={sim.id}
          sim={sim}
          onInvite={onInvite}
          onPrefetch={prefetchSimulation}
        />
      ))}
    </div>
  );
}
