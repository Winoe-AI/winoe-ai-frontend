import type { CandidateInvite } from '@/features/candidate/session/api';
import { deriveCandidateInviteState } from '../utils/candidateInviteViewModel';

type Props = { invite: CandidateInvite };

export function InviteProgress({ invite }: Props) {
  const { progress } = deriveCandidateInviteState(invite);
  const summary = progress;
  if (!summary) return null;
  return (
    <div className="mt-3">
      <div className="h-2 rounded-full bg-gray-100">
        <div
          className="h-2 rounded-full bg-blue-600"
          style={{ width: `${(summary.completed / summary.total) * 100}%` }}
        />
      </div>
      <div className="mt-1 text-xs text-gray-600">
        Progress: {summary.completed}/{summary.total}
      </div>
    </div>
  );
}
