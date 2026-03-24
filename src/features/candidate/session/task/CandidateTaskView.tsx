'use client';

import { useMemo, type ComponentType, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { Task, SubmitPayload, SubmitResponse } from './types';
import { TaskContainer } from './components/TaskContainer';
import { TaskHeader } from './components/TaskHeader';
import { TaskDescription } from './components/TaskDescription';
import { TaskTextInput } from './components/TaskTextInput';
import { TaskStatus } from './components/TaskStatus';
import { TaskPanelErrorBanner } from './components/TaskPanelErrorBanner';
import { TaskActions } from './components/TaskActions';
import { DraftSaveStatus } from './components/DraftSaveStatus';
import { useTaskSubmitController } from './hooks/useTaskSubmitController';
import { isDay5ReflectionTask } from './utils/day5Reflection';
import type { WindowActionGate } from '../lib/windowState';

const LazyDay5ReflectionPanel = dynamic(
  () =>
    import('./components/Day5ReflectionPanel').then(
      (mod) => mod.Day5ReflectionPanel,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-600">
        Loading reflection panel...
      </div>
    ),
  },
);

const LazyHandoffUploadPanel = dynamic(
  () =>
    import('./handoff/HandoffUploadPanel').then(
      (mod) => mod.HandoffUploadPanel,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-600">
        Loading upload panel...
      </div>
    ),
  },
);

type Day5ReflectionPanelProps = {
  candidateSessionId: number | null;
  task: Task;
  submitting: boolean;
  submitError?: string | null;
  actionGate: WindowActionGate;
  onTaskWindowClosed?: (err: unknown) => void;
  onSubmit: (
    payload: SubmitPayload,
  ) => Promise<SubmitResponse | void> | SubmitResponse | void;
};

type HandoffUploadPanelProps = {
  candidateSessionId: number | null;
  task: Task;
  actionGate: WindowActionGate;
  onTaskWindowClosed?: (err: unknown) => void;
};

let Day5ReflectionPanelComponent: ComponentType<Day5ReflectionPanelProps> =
  LazyDay5ReflectionPanel;
let HandoffUploadPanelComponent: ComponentType<HandoffUploadPanelProps> =
  LazyHandoffUploadPanel;

if (process.env.NODE_ENV === 'test') {
  const day5Module =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('./components/Day5ReflectionPanel') as typeof import('./components/Day5ReflectionPanel');
  Day5ReflectionPanelComponent = day5Module.Day5ReflectionPanel;
  const handoffModule =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('./handoff/HandoffUploadPanel') as typeof import('./handoff/HandoffUploadPanel');
  HandoffUploadPanelComponent = handoffModule.HandoffUploadPanel;
}

export default function CandidateTaskView(props: {
  candidateSessionId: number | null;
  task: Task;
  submitting: boolean;
  submitError?: string | null;
  actionGate?: WindowActionGate;
  onTaskWindowClosed?: (err: unknown) => void;
  onSubmit: (
    payload: SubmitPayload,
  ) => Promise<SubmitResponse | void> | SubmitResponse | void;
}) {
  const actionGate = props.actionGate ?? {
    isReadOnly: false,
    disabledReason: null,
    comeBackAt: null,
  };
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

function CandidateTaskViewInner({
  candidateSessionId,
  task,
  onSubmit,
  submitting,
  submitError,
  actionGate,
  onTaskWindowClosed,
}: {
  candidateSessionId: number | null;
  task: Task;
  submitting: boolean;
  submitError?: string | null;
  actionGate?: WindowActionGate;
  onTaskWindowClosed?: (err: unknown) => void;
  onSubmit: (
    payload: SubmitPayload,
  ) => Promise<SubmitResponse | void> | SubmitResponse | void;
}) {
  const {
    textTask,
    text,
    setText,
    savedAt,
    draftAutosaveStatus,
    draftRestoreApplied,
    draftError,
    saveDraftNow,
    actionStatus,
    displayStatus,
    lastProgress,
    githubNative,
    readOnly,
    disabled,
    disabledReason,
    submittedLabel,
    submittedShaLabel,
    submittedSha,
    errorToShow,
    saveAndSubmit,
  } = useTaskSubmitController({
    candidateSessionId,
    task,
    onSubmit,
    submitting,
    submitError,
    onTaskWindowClosed,
    actionGate: actionGate ?? {
      isReadOnly: false,
      disabledReason: null,
      comeBackAt: null,
    },
  });

  const showDay1DraftStatus = textTask && task.dayIndex === 1;
  const showDay5DraftStatus = textTask && task.dayIndex === 5;
  const draftStatusSlot = useMemo<ReactNode>(
    () =>
      showDay1DraftStatus ? (
        <DraftSaveStatus
          status={draftAutosaveStatus}
          lastSavedAt={savedAt}
          restoreApplied={draftRestoreApplied}
          error={draftError}
        />
      ) : null,
    [
      draftAutosaveStatus,
      draftError,
      draftRestoreApplied,
      savedAt,
      showDay1DraftStatus,
    ],
  );

  return (
    <TaskContainer>
      <TaskHeader task={task} statusSlot={draftStatusSlot} />
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
      {showDay5DraftStatus ? (
        <div className="sticky bottom-2 z-20 mt-3 rounded-md border border-gray-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
          <DraftSaveStatus
            status={draftAutosaveStatus}
            lastSavedAt={savedAt}
            restoreApplied={draftRestoreApplied}
            error={draftError}
          />
        </div>
      ) : null}

      <TaskStatus
        displayStatus={displayStatus}
        progress={lastProgress}
        submittedLabel={submittedLabel}
        submittedShaLabel={submittedShaLabel}
        submittedSha={submittedSha}
      />
      <TaskPanelErrorBanner message={errorToShow} />

      <TaskActions
        isTextTask={textTask}
        displayStatus={actionStatus}
        disabled={disabled}
        disabledReason={disabledReason}
        onSaveDraft={textTask ? saveDraftNow : undefined}
        onSubmit={saveAndSubmit}
      />
    </TaskContainer>
  );
}
