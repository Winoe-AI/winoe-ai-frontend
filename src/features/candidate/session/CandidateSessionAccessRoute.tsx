import { ErrorView } from './views/ErrorView';
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
          'You do not have access to this invite. Please sign in with the email tied to the invite.'
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
      <ErrorView
        inviteErrorState={props.inviteErrorState ?? 'expired'}
        inviteContactName={props.inviteContactName}
        inviteContactEmail={props.inviteContactEmail}
        loginHref={props.loginHref}
        onDashboard={props.onDashboard}
        onRetry={props.onRetryInit}
      />
    );
  }

  return null;
}
