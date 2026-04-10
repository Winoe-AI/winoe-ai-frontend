import { StateMessage } from './components/StateMessage';
import Button from '@/shared/ui/Button';
import type {
  CandidateSessionViewProps as Props,
  ViewState,
} from './views/types';

type CandidateSessionAccessRouteProps = {
  props: Props;
  view: ViewState;
  errorMessage: string | null;
};

export function CandidateSessionAccessRoute({
  props,
  view,
  errorMessage,
}: CandidateSessionAccessRouteProps) {
  if (view === 'accessDenied') {
    return (
      <StateMessage
        title="Access denied"
        description={
          errorMessage ??
          'You do not have access to this invite. Please confirm you are signed in with the matching email.'
        }
        action={
          <a href={props.loginHref}>
            <Button variant="secondary">Go to sign in</Button>
          </a>
        }
      />
    );
  }

  if (view === 'expired') {
    return (
      <StateMessage
        title="Invite expired"
        description={
          errorMessage ??
          'This invite has expired. Please contact your Talent Partner for a new link.'
        }
      />
    );
  }

  return null;
}
