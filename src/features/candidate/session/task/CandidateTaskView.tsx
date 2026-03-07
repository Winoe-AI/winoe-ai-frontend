'use client';

import { Task, SubmitPayload, SubmitResponse } from './types';
import { TaskContainer } from './components/TaskContainer';
import { TaskHeader } from './components/TaskHeader';
import { TaskDescription } from './components/TaskDescription';
import { TaskTextInput } from './components/TaskTextInput';
import { TaskStatus } from './components/TaskStatus';
import { TaskPanelErrorBanner } from './components/TaskPanelErrorBanner';
import { TaskActions } from './components/TaskActions';
import { useTaskSubmitController } from './hooks/useTaskSubmitController';
import type { WindowActionGate } from '../lib/windowState';

export default function CandidateTaskView(props: {
  task: Task;
  submitting: boolean;
  submitError?: string | null;
  actionGate?: WindowActionGate;
  onSubmit: (
    payload: SubmitPayload,
  ) => Promise<SubmitResponse | void> | SubmitResponse | void;
}) {
  return <CandidateTaskViewInner key={props.task.id} {...props} />;
}

function CandidateTaskViewInner({
  task,
  onSubmit,
  submitting,
  submitError,
  actionGate,
}: {
  task: Task;
  submitting: boolean;
  submitError?: string | null;
  actionGate?: WindowActionGate;
  onSubmit: (
    payload: SubmitPayload,
  ) => Promise<SubmitResponse | void> | SubmitResponse | void;
}) {
  const {
    textTask,
    text,
    setText,
    savedAt,
    saveDraftNow,
    displayStatus,
    lastProgress,
    githubNative,
    readOnly,
    disabled,
    disabledReason,
    errorToShow,
    saveAndSubmit,
  } = useTaskSubmitController({
    task,
    onSubmit,
    submitting,
    submitError,
    actionGate: actionGate ?? {
      isReadOnly: false,
      disabledReason: null,
      comeBackAt: null,
    },
  });

  return (
    <TaskContainer>
      <TaskHeader task={task} />
      <TaskDescription description={task.description} />

      <div className="mt-6">
        {githubNative ? (
          readOnly ? (
            <div className="rounded-md border border-gray-300 bg-gray-100 p-3 text-sm text-gray-900">
              {disabledReason ??
                'This day is closed and read-only. Review your prompt and recorded submission details in the banner above.'}
            </div>
          ) : (
            <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
              Work in your GitHub repository or Codespace. When you’re ready,
              submit to move to the next day.
            </div>
          )
        ) : (
          <TaskTextInput
            value={text}
            onChange={setText}
            disabled={disabled}
            readOnly={readOnly}
            readOnlyReason={disabledReason}
            savedAt={savedAt}
          />
        )}
      </div>

      <TaskStatus displayStatus={displayStatus} progress={lastProgress} />
      <TaskPanelErrorBanner message={errorToShow} />

      <TaskActions
        isTextTask={textTask}
        displayStatus={displayStatus}
        disabled={disabled}
        disabledReason={disabledReason}
        onSaveDraft={textTask ? saveDraftNow : undefined}
        onSubmit={saveAndSubmit}
      />
    </TaskContainer>
  );
}
