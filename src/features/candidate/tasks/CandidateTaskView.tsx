'use client';

import { isDay5ReflectionTask } from './utils/day5ReflectionUtils';
import { CandidateTaskViewInner } from './CandidateTaskViewInner';
import {
  Day5ReflectionPanelComponent,
  HandoffUploadPanelComponent,
} from './CandidateTaskViewPanels';
import {
  DEFAULT_ACTION_GATE,
  type CandidateTaskViewProps,
} from './CandidateTaskView.types';

export default function CandidateTaskView(props: CandidateTaskViewProps) {
  const actionGate = props.actionGate ?? DEFAULT_ACTION_GATE;

  if (props.task.type === 'handoff') {
    return (
      <HandoffUploadPanelComponent
        key={props.task.id}
        candidateSessionId={props.candidateSessionId}
        task={props.task}
        actionGate={actionGate}
        onTaskWindowClosed={props.onTaskWindowClosed}
      />
    );
  }

  if (isDay5ReflectionTask(props.task)) {
    return (
      <Day5ReflectionPanelComponent
        key={props.task.id}
        candidateSessionId={props.candidateSessionId}
        task={props.task}
        submitting={props.submitting}
        submitError={props.submitError}
        actionGate={actionGate}
        onTaskWindowClosed={props.onTaskWindowClosed}
        onSubmit={props.onSubmit}
      />
    );
  }

  return <CandidateTaskViewInner key={props.task.id} {...props} />;
}
