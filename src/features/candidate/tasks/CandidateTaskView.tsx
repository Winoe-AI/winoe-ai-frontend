'use client';

import { CandidateTaskViewInner } from './CandidateTaskViewInner';
import { HandoffUploadPanelComponent } from './CandidateTaskViewPanels';
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

  return <CandidateTaskViewInner key={props.task.id} {...props} />;
}
