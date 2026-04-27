'use client';

import { TaskContainer } from './components/TaskContainer';
import { TaskHeader } from './components/TaskHeader';
import { TaskDescription } from './components/TaskDescription';
import { TaskStatus } from './components/TaskStatus';
import { TaskPanelErrorBanner } from './components/TaskPanelErrorBanner';
import { TaskActions } from './components/TaskActions';
import { TaskDraftStatusSlots } from './components/TaskDraftStatusSlots';
import { TaskWorkArea } from './components/TaskWorkArea';
import { useTaskSubmitController } from './hooks/useTaskSubmitController';
import {
  DEFAULT_ACTION_GATE,
  type CandidateTaskViewProps,
} from './CandidateTaskView.types';

export function CandidateTaskViewInner({
  candidateSessionId,
  task,
  onSubmit,
  submitting,
  submitError,
  actionGate,
  onTaskWindowClosed,
}: CandidateTaskViewProps) {
  const controller = useTaskSubmitController({
    candidateSessionId,
    task,
    onSubmit,
    submitting,
    submitError,
    onTaskWindowClosed,
    actionGate: actionGate ?? DEFAULT_ACTION_GATE,
  });
  const showDay1DraftStatus = controller.textTask && task.dayIndex === 1;
  const showDay5DraftStatus = controller.textTask && task.dayIndex === 5;
  const isDay1DesignDoc = controller.textTask && task.dayIndex === 1;
  const comeBackAt = (actionGate ?? DEFAULT_ACTION_GATE).comeBackAt;
  const hideDay1Actions = isDay1DesignDoc && controller.readOnly && !comeBackAt;
  const draftStatus = TaskDraftStatusSlots({
    showDay1DraftStatus:
      showDay1DraftStatus && (!controller.readOnly || !!controller.draftError),
    showDay5DraftStatus,
    draftAutosaveStatus: controller.draftAutosaveStatus,
    savedAt: controller.savedAt,
    draftRestoreApplied: controller.draftRestoreApplied,
    draftError: controller.draftError,
  });

  return (
    <TaskContainer>
      <TaskHeader task={task} statusSlot={draftStatus.headerStatusSlot} />
      {isDay1DesignDoc ? null : (
        <TaskDescription description={task.description} />
      )}
      <TaskWorkArea
        dayIndex={task.dayIndex}
        projectBrief={task.description}
        cutoffAt={task.cutoffAt}
        githubNative={controller.githubNative}
        readOnly={controller.readOnly}
        disabledReason={controller.disabledReason}
        draftError={controller.draftError}
        text={controller.text}
        disabled={controller.disabled}
        savedAt={controller.savedAt}
        onChangeText={controller.setText}
      />
      {draftStatus.stickyDraftStatus}
      <TaskStatus
        displayStatus={controller.displayStatus}
        progress={controller.lastProgress}
        submittedLabel={controller.submittedLabel}
        submittedShaLabel={controller.submittedShaLabel}
        submittedSha={controller.submittedSha}
      />
      <TaskPanelErrorBanner message={controller.errorToShow} />
      {hideDay1Actions ? null : (
        <TaskActions
          isTextTask={controller.textTask}
          displayStatus={controller.actionStatus}
          disabled={controller.disabled}
          disabledReason={controller.disabledReason}
          onSaveDraft={
            controller.textTask ? controller.saveDraftNow : undefined
          }
          onSubmit={controller.saveAndSubmit}
          requireSubmitConfirmation={isDay1DesignDoc}
        />
      )}
    </TaskContainer>
  );
}
