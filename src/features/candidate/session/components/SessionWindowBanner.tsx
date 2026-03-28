import type { DerivedWindowState } from '../lib/windowState';
import { SessionWindowClosedBanner } from './SessionWindowBannerClosed';
import {
  SessionWindowClosedBeforeStartBanner,
  SessionWindowOpenBanner,
} from './SessionWindowBannerStates';

type Props = {
  windowState: DerivedWindowState;
  lastDraftSavedAt: number | null;
  lastSubmissionAt: string | null;
  lastSubmissionId: number | null;
};

export function SessionWindowBanner({
  windowState,
  lastDraftSavedAt,
  lastSubmissionAt,
  lastSubmissionId,
}: Props) {
  if (windowState.phase === 'unknown' || windowState.dayIndex === null)
    return null;

  if (windowState.phase === 'open')
    return <SessionWindowOpenBanner windowState={windowState} />;

  if (windowState.phase === 'closed_before_start')
    return <SessionWindowClosedBeforeStartBanner windowState={windowState} />;

  return (
    <SessionWindowClosedBanner
      windowState={windowState}
      lastDraftSavedAt={lastDraftSavedAt}
      lastSubmissionAt={lastSubmissionAt}
      lastSubmissionId={lastSubmissionId}
    />
  );
}
