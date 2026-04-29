'use client';

import { TaskContainer } from './TaskContainer';
import { TaskDescription } from './TaskDescription';
import { TaskHeader } from './TaskHeader';
import { TaskPanelErrorBanner } from './TaskPanelErrorBanner';
import { Day5ReflectionActions } from './day5Reflection/Day5ReflectionActions';
import { Day5ReflectionClosedView } from './day5Reflection/Day5ReflectionClosedView';
import { Day5ReflectionCompletionView } from './day5Reflection/Day5ReflectionCompletionView';
import { Day5ReflectionGuidance } from './day5Reflection/Day5ReflectionGuidance';
import { Day5ReflectionEditableView } from './day5Reflection/Day5ReflectionEditableView';
import { Day5ReflectionMarkdownPreview } from './day5Reflection/Day5ReflectionMarkdownPreview';
import type { Day5ReflectionPanelProps } from './day5Reflection/day5ReflectionPanel.types';
import { useDay5ReflectionFormState } from './day5Reflection/useDay5ReflectionFormState';
import { withDay5ReflectionCopy } from '../utils/day5Reflection.taskCopyUtils';

export function Day5ReflectionPanel({
  candidateSessionId,
  task,
  submitting,
  submitError,
  actionGate,
  onTaskWindowClosed,
  onSubmit,
}: Day5ReflectionPanelProps) {
  const reflection = useDay5ReflectionFormState({
    candidateSessionId,
    task,
    submitting,
    submitError,
    actionGate,
    onTaskWindowClosed,
    onSubmit,
  });
  const displayTask = withDay5ReflectionCopy(task);
  const completed =
    reflection.submittedTerminal ||
    Boolean(task.recordedSubmission?.submittedAt);
  const notYetOpen =
    reflection.readOnly && Boolean(actionGate.comeBackAt) && !completed;
  const closedAfterDeadline = reflection.readOnly && !notYetOpen && !completed;

  return (
    <TaskContainer>
      <TaskHeader task={displayTask} />

      {completed ? (
        <Day5ReflectionCompletionView />
      ) : notYetOpen ? (
        <Day5ReflectionClosedView
          variant="not_open"
          reason={reflection.readOnlyReason}
        />
      ) : closedAfterDeadline ? (
        <Day5ReflectionClosedView
          variant="closed"
          reason={reflection.readOnlyReason}
        />
      ) : (
        <>
          <TaskDescription description={displayTask.description} />
          <Day5ReflectionGuidance />
          <Day5ReflectionEditableView
            mode={reflection.mode}
            previewPending={reflection.previewPending}
            markdown={reflection.markdown}
            markdownPreview={reflection.markdownPreview}
            displayStatus={reflection.displayStatus}
            submitting={submitting}
            draftAutosave={reflection.draftAutosave}
            PreviewComponent={Day5ReflectionMarkdownPreview}
            onModeChange={reflection.handleModeChange}
            onMarkdownChange={reflection.handleMarkdownChange}
          />
          <TaskPanelErrorBanner message={reflection.errorToShow} />
          <Day5ReflectionActions
            displayStatus={reflection.displayStatus}
            submitting={submitting}
            submitDisabled={reflection.submitDisabled}
            hasClientValidationErrors={reflection.hasClientValidationErrors}
            onSaveDraft={reflection.onSaveDraft}
            onSubmitReflection={reflection.onSubmitReflection}
          />
        </>
      )}
    </TaskContainer>
  );
}
