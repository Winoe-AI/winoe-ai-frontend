import { CandidateSessionActiveRoute } from './CandidateSessionActiveRoute';
import { CandidateSessionPreflightRoute } from './CandidateSessionPreflightRoute';
import { RunningViewComponent } from './CandidateSessionRunningViewLoader';
import type {
  CandidateSessionViewProps as Props,
  ViewState,
} from './views/types';

export type { ViewState };

export function CandidateSessionView(props: Props) {
  const preflight = CandidateSessionPreflightRoute({ props });
  if (preflight) return preflight;

  return CandidateSessionActiveRoute({
    props,
    RunningViewComponent,
  });
}
