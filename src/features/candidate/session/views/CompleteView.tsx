import Button from '@/shared/ui/Button';
import { StateMessage } from '../components/StateMessage';

type CompleteViewProps = {
  onReview: () => void;
  onDashboard: () => void;
};

export function CompleteView({ onReview, onDashboard }: CompleteViewProps) {
  return (
    <StateMessage
      title="Trial complete 🎉"
      description="You’ve submitted all 5 days. Review your completed work any time from the candidate dashboard."
      action={
        <div className="flex flex-wrap gap-2">
          <Button onClick={onReview}>Review submissions</Button>
          <Button variant="secondary" onClick={onDashboard}>
            Back to Candidate Dashboard
          </Button>
        </div>
      }
    />
  );
}
