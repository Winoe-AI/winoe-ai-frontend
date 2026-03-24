'use client';

import { useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import Button from '@/shared/ui/Button';
import { queryKeys } from '@/shared/query';
import { EmptyState } from '@/shared/ui/EmptyState';
import type { SimulationListItem } from '@/features/recruiter/api';
import { formatSimulationCreatedDate } from '@/features/recruiter/utils/formatters';
import {
  fetchSimulationCandidatesQuery,
  fetchSimulationCompareQuery,
  fetchSimulationDetailQuery,
  SIMULATION_CANDIDATES_STALE_TIME_MS,
  SIMULATION_COMPARE_STALE_TIME_MS,
  SIMULATION_DETAIL_STALE_TIME_MS,
} from '@/features/recruiter/simulations/detail/queries';

type RecruiterSimulationListProps = {
  simulations: SimulationListItem[];
  onInvite: (sim: SimulationListItem) => void;
};

const LINK_PREFETCH = process.env.NODE_ENV === 'test' ? undefined : false;
const LINK_PREFETCH_RETURNING =
  process.env.NODE_ENV === 'test' ? undefined : true;
const ENABLE_INTENT_PREFETCH = process.env.NODE_ENV !== 'test';
const DASHBOARD_VISITED_KEY = 'tenon:dashboard:visited';

export function RecruiterSimulationList({
  simulations,
  onInvite,
}: RecruiterSimulationListProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const prefetchSimulation = useCallback(
    (simulationId: string) => {
      if (!ENABLE_INTENT_PREFETCH) return;
      void router.prefetch(`/dashboard/simulations/${simulationId}`);
      void Promise.all([
        queryClient.prefetchQuery({
          queryKey: queryKeys.recruiter.simulationDetail(simulationId),
          queryFn: ({ signal }) =>
            fetchSimulationDetailQuery(simulationId, signal),
          staleTime: SIMULATION_DETAIL_STALE_TIME_MS,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.recruiter.simulationCandidates(simulationId),
          queryFn: ({ signal }) =>
            fetchSimulationCandidatesQuery(simulationId, signal),
          staleTime: SIMULATION_CANDIDATES_STALE_TIME_MS,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.recruiter.simulationCompare(simulationId),
          queryFn: ({ signal }) =>
            fetchSimulationCompareQuery(simulationId, signal),
          staleTime: SIMULATION_COMPARE_STALE_TIME_MS,
        }),
      ]);
    },
    [queryClient, router],
  );

  useEffect(() => {
    if (!ENABLE_INTENT_PREFETCH || simulations.length === 0) return;
    const firstSimulationId = simulations[0]?.id;
    if (!firstSimulationId) return;
    const hasVisited =
      window.sessionStorage.getItem(DASHBOARD_VISITED_KEY) === '1';
    window.sessionStorage.setItem(DASHBOARD_VISITED_KEY, '1');
    if (!hasVisited) return;
    prefetchSimulation(firstSimulationId);
  }, [prefetchSimulation, simulations]);

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
        <div
          key={sim.id}
          className="border-b border-gray-200 p-3 last:border-b-0"
        >
          <div className="grid grid-cols-12 items-center gap-3">
            <div className="col-span-4">
              <Link
                href={`/dashboard/simulations/${sim.id}`}
                prefetch={LINK_PREFETCH_RETURNING}
                onMouseEnter={() => prefetchSimulation(sim.id)}
                onFocus={() => prefetchSimulation(sim.id)}
                className="font-medium text-blue-600 hover:underline"
              >
                {sim.title}
              </Link>
              {typeof sim.candidateCount === 'number' ? (
                <p className="text-xs text-gray-500">
                  {sim.candidateCount} candidate(s)
                </p>
              ) : null}
              <p className="text-xs text-gray-500">
                Template: {sim.templateKey?.trim() ? sim.templateKey : 'N/A'}
              </p>
            </div>

            <div className="col-span-3">
              <p className="text-sm text-gray-700">{sim.role}</p>
            </div>

            <div className="col-span-3">
              <p className="text-sm text-gray-700">
                {formatSimulationCreatedDate(sim.createdAt)}
              </p>
            </div>

            <div className="col-span-2 flex justify-end">
              <Button onClick={() => onInvite(sim)}>Invite candidate</Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
