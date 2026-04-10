import Link from 'next/link';
import Button from '@/shared/ui/Button';
import type { TrialListItem } from '@/features/talent-partner/api';
import { formatTrialCreatedDate } from '@/features/talent-partner/utils/formattersUtils';
import { LINK_PREFETCH_RETURNING } from './trialListPrefetch';

type Props = {
  trial: TrialListItem;
  onInvite: (trial: TrialListItem) => void;
  onPrefetch: (trialId: string) => void;
};

export function TrialListRow({ trial, onInvite, onPrefetch }: Props) {
  return (
    <div className="border-b border-gray-200 p-3 last:border-b-0">
      <div className="grid grid-cols-12 items-center gap-3">
        <div className="col-span-4">
          <Link
            href={`/dashboard/trials/${trial.id}`}
            prefetch={LINK_PREFETCH_RETURNING}
            onMouseEnter={() => onPrefetch(trial.id)}
            onFocus={() => onPrefetch(trial.id)}
            className="font-medium text-blue-600 hover:underline"
          >
            {trial.title}
          </Link>
          {typeof trial.candidateCount === 'number' ? (
            <p className="text-xs text-gray-500">
              {trial.candidateCount} candidate(s)
            </p>
          ) : null}
          <p className="text-xs text-gray-500">
            Template: {trial.templateKey?.trim() ? trial.templateKey : 'N/A'}
          </p>
        </div>

        <div className="col-span-3">
          <p className="text-sm text-gray-700">{trial.role}</p>
        </div>

        <div className="col-span-3">
          <p className="text-sm text-gray-700">
            {formatTrialCreatedDate(trial.createdAt)}
          </p>
        </div>

        <div className="col-span-2 flex justify-end">
          <Button onClick={() => onInvite(trial)}>Invite candidate</Button>
        </div>
      </div>
    </div>
  );
}
