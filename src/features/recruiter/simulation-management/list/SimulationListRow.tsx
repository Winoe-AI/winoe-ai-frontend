import Link from 'next/link';
import Button from '@/shared/ui/Button';
import type { SimulationListItem } from '@/features/recruiter/api';
import { formatSimulationCreatedDate } from '@/features/recruiter/utils/formattersUtils';
import { LINK_PREFETCH_RETURNING } from './simulationListPrefetch';

type Props = {
  sim: SimulationListItem;
  onInvite: (sim: SimulationListItem) => void;
  onPrefetch: (simulationId: string) => void;
};

export function SimulationListRow({ sim, onInvite, onPrefetch }: Props) {
  return (
    <div className="border-b border-gray-200 p-3 last:border-b-0">
      <div className="grid grid-cols-12 items-center gap-3">
        <div className="col-span-4">
          <Link
            href={`/dashboard/simulations/${sim.id}`}
            prefetch={LINK_PREFETCH_RETURNING}
            onMouseEnter={() => onPrefetch(sim.id)}
            onFocus={() => onPrefetch(sim.id)}
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
  );
}
