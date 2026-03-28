'use client';

import { TaskContainer } from './TaskContainer';
import { TaskDescription } from './TaskDescription';
import { TaskHeader } from './TaskHeader';
import { TaskPanelErrorBanner } from './TaskPanelErrorBanner';
import { TaskStatus } from './TaskStatus';
import { Day5ReflectionActions } from './day5Reflection/Day5ReflectionActions';
import { Day5ReflectionEditableView } from './day5Reflection/Day5ReflectionEditableView';
import { Day5ReflectionMarkdownPreview } from './day5Reflection/Day5ReflectionMarkdownPreview';
import { Day5ReflectionReadOnlyView } from './day5Reflection/Day5ReflectionReadOnlyView';
import type { Day5ReflectionPanelProps } from './day5Reflection/day5ReflectionPanel.types';
import { useDay5ReflectionFormState } from './day5Reflection/useDay5ReflectionFormState';

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

  return (
    <TaskContainer>
      <TaskHeader task={task} />
      <TaskDescription description={task.description} />

      {reflection.readOnly ? (
        <Day5ReflectionReadOnlyView
          readOnlyReason={reflection.readOnlyReason}
          readOnlySections={reflection.readOnlySections}
          readOnlyFallbackMarkdown={reflection.readOnlyFallbackMarkdown}
          PreviewComponent={Day5ReflectionMarkdownPreview}
        />
      ) : (
        <Day5ReflectionEditableView
          mode={reflection.mode}
          previewPending={reflection.previewPending}
          markdownPreview={reflection.markdownPreview}
          submitAttempted={reflection.submitAttempted}
          touched={reflection.touched}
          backendFieldErrors={reflection.backendFieldErrors}
          clientFieldMessages={reflection.clientFieldMessages}
          sections={reflection.sections}
          displayStatus={reflection.displayStatus}
          submitting={submitting}
          draftAutosave={reflection.draftAutosave}
          PreviewComponent={Day5ReflectionMarkdownPreview}
          onModeChange={reflection.handleModeChange}
          onSectionChange={reflection.handleSectionChange}
          onSectionBlur={reflection.handleSectionBlur}
        />
      )}

      {reflection.submittedTerminal ? (
        <div className="mt-4 rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-900">
          Submitted. Your Day 5 reflection is finalized.
        </div>
      ) : null}

      <TaskStatus
        displayStatus={reflection.displayStatus}
        progress={reflection.lastProgress}
      />
      <TaskPanelErrorBanner message={reflection.errorToShow} />

      {!reflection.readOnly ? (
        <Day5ReflectionActions
          displayStatus={reflection.displayStatus}
          submitting={submitting}
          submitDisabled={reflection.submitDisabled}
          hasClientValidationErrors={reflection.hasClientValidationErrors}
          onSaveDraft={reflection.onSaveDraft}
          onSubmitReflection={reflection.onSubmitReflection}
        />
      ) : null}
    </TaskContainer>
  );
}
