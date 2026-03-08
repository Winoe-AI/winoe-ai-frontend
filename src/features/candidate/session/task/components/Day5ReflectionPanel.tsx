'use client';

import { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Button from '@/shared/ui/Button';
import type { MarkdownPreviewProps } from '@/shared/ui/Markdown';
import type { WindowActionGate } from '../../lib/windowState';
import type { SubmitPayload, SubmitResponse, Task } from '../types';
import { markTextDraftSavedAt } from '../utils/draftStorage';
import { useSubmitHandler } from '../hooks/useSubmitHandler';
import { useTaskDraftAutosave } from '../hooks/useTaskDraftAutosave';
import {
  buildDay5ReflectionContentText,
  buildDay5ReflectionPayload,
  DAY5_REFLECTION_MIN_SECTION_CHARS,
  DAY5_REFLECTION_SECTIONS,
  day5SectionLabel,
  day5ValidationMessages,
  emptyDay5ReflectionSections,
  extractDay5SectionsFromContentJson,
  hasDay5SectionContent,
  hasDay5ValidationErrors,
  mapDay5BackendValidationErrors,
  validateDay5ReflectionSections,
  type Day5FieldErrors,
  type Day5ReflectionSectionKey,
  type Day5ReflectionSections,
} from '../utils/day5Reflection';
import { DraftSaveStatus } from './DraftSaveStatus';
import { TaskContainer } from './TaskContainer';
import { TaskDescription } from './TaskDescription';
import { TaskHeader } from './TaskHeader';
import { TaskPanelErrorBanner } from './TaskPanelErrorBanner';
import { TaskStatus } from './TaskStatus';

const LazyMarkdownPreview = dynamic(
  () => import('@/shared/ui/Markdown').then((m) => m.MarkdownPreview),
  {
    loading: () => (
      <div className="text-xs text-gray-500" aria-label="loading-markdown">
        Loading preview…
      </div>
    ),
    ssr: false,
  },
);

let PreviewComponent: React.ComponentType<MarkdownPreviewProps> =
  LazyMarkdownPreview;
if (process.env.NODE_ENV === 'test') {
  const mod =
    require('@/shared/ui/Markdown') as typeof import('@/shared/ui/Markdown'); // eslint-disable-line @typescript-eslint/no-require-imports
  PreviewComponent = mod.MarkdownPreview;
}

function emptyTouchedMap(): Record<Day5ReflectionSectionKey, boolean> {
  return {
    challenges: false,
    decisions: false,
    tradeoffs: false,
    communication: false,
    next: false,
  };
}

type Props = {
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

export function Day5ReflectionPanel({
  candidateSessionId,
  task,
  submitting,
  submitError,
  actionGate,
  onTaskWindowClosed,
  onSubmit,
}: Props) {
  const recordedSubmission = task.recordedSubmission ?? null;
  const recordedSections = useMemo(
    () => extractDay5SectionsFromContentJson(recordedSubmission?.contentJson),
    [recordedSubmission?.contentJson],
  );
  const hasStructuredRecordedContent = useMemo(
    () => hasDay5SectionContent(recordedSections),
    [recordedSections],
  );
  const recordedContentText =
    typeof recordedSubmission?.contentText === 'string'
      ? recordedSubmission.contentText
      : '';
  const hasRecordedSubmission = Boolean(recordedSubmission?.submittedAt);

  const [sections, setSections] = useState<Day5ReflectionSections>(
    hasStructuredRecordedContent
      ? recordedSections
      : emptyDay5ReflectionSections(),
  );
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [touched, setTouched] =
    useState<Record<Day5ReflectionSectionKey, boolean>>(emptyTouchedMap());
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [backendFieldErrors, setBackendFieldErrors] = useState<Day5FieldErrors>(
    {},
  );
  const [localFormError, setLocalFormError] = useState<string | null>(null);
  const [submittedTerminal, setSubmittedTerminal] = useState(
    hasRecordedSubmission,
  );

  const { submitStatus, lastProgress, getLastError, handleSubmit } =
    useSubmitHandler(onSubmit);

  const readOnly = actionGate.isReadOnly || submittedTerminal;
  const readOnlyReason = actionGate.isReadOnly
    ? (actionGate.disabledReason ??
      'Day closed. Reflection is read-only outside the scheduled window.')
    : submittedTerminal
      ? 'Submitted. Reflection is now read-only.'
      : null;

  const validationCodes = useMemo(
    () => validateDay5ReflectionSections(sections),
    [sections],
  );
  const clientFieldMessages = useMemo(
    () => day5ValidationMessages(validationCodes),
    [validationCodes],
  );
  const hasClientValidationErrors = hasDay5ValidationErrors(validationCodes);
  const displayStatus = submitting
    ? 'submitting'
    : submittedTerminal
      ? 'submitted'
      : submitStatus;

  const draftAutosave = useTaskDraftAutosave<Day5ReflectionSections>({
    taskId: task.id,
    candidateSessionId,
    isEditable: !readOnly,
    hasFinalizedContent: readOnly,
    value: sections,
    serialize: useCallback((value) => {
      const reflection = buildDay5ReflectionPayload(value);
      return {
        contentText: buildDay5ReflectionContentText(reflection),
        contentJson: { reflection },
      };
    }, []),
    deserialize: useCallback((draft) => {
      const fromJson = extractDay5SectionsFromContentJson(draft.contentJson);
      if (hasDay5SectionContent(fromJson)) return fromJson;
      return null;
    }, []),
    onRestore: useCallback((restored) => {
      setSections(restored);
      setTouched(emptyTouchedMap());
      setSubmitAttempted(false);
      setBackendFieldErrors({});
      setLocalFormError(null);
    }, []),
    onTaskWindowClosed,
    onSavedAt: useCallback(
      (savedAtMs: number) => {
        markTextDraftSavedAt(task.id, savedAtMs);
      },
      [task.id],
    ),
  });

  const markdownPreview = useMemo(
    () => buildDay5ReflectionContentText(buildDay5ReflectionPayload(sections)),
    [sections],
  );
  const replayReadOnly = actionGate.isReadOnly || hasRecordedSubmission;
  const readOnlySections =
    replayReadOnly &&
    !recordedContentText.trim() &&
    hasStructuredRecordedContent
      ? recordedSections
      : !replayReadOnly && hasDay5SectionContent(sections)
        ? sections
        : null;
  const readOnlyFallbackMarkdown = replayReadOnly
    ? recordedContentText
    : markdownPreview;

  const handleSectionChange = (
    key: Day5ReflectionSectionKey,
    value: string,
  ) => {
    setSections((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
    if (backendFieldErrors[key]) {
      setBackendFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    if (localFormError) setLocalFormError(null);
  };

  const submitDisabled =
    readOnly ||
    displayStatus !== 'idle' ||
    submitting ||
    hasClientValidationErrors;

  const onSaveDraft = () => {
    void draftAutosave.flushNow();
  };

  const onSubmitReflection = async () => {
    if (readOnly || displayStatus !== 'idle' || submitting) return;
    setSubmitAttempted(true);
    setBackendFieldErrors({});
    setLocalFormError(null);

    if (hasClientValidationErrors) return;

    const reflection = buildDay5ReflectionPayload(sections);
    const payload: SubmitPayload = {
      reflection,
      contentText: buildDay5ReflectionContentText(reflection),
    };
    const response = await handleSubmit(payload);
    if (response === 'submit-failed') {
      const mapped = mapDay5BackendValidationErrors(getLastError());
      if (mapped.hasValidationErrors) {
        setBackendFieldErrors(mapped.fieldErrors);
        setLocalFormError(mapped.formError);
      }
      return;
    }

    setSubmittedTerminal(true);
  };

  const errorToShow =
    localFormError ??
    (Object.keys(backendFieldErrors).length > 0 ? null : (submitError ?? null));

  return (
    <TaskContainer>
      <TaskHeader task={task} />
      <TaskDescription description={task.description} />

      {readOnly ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-md border border-gray-300 bg-gray-100 p-3 text-sm text-gray-900">
            {readOnlyReason}
          </div>
          {readOnlySections ? (
            DAY5_REFLECTION_SECTIONS.map((section) => (
              <section key={section} className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">
                  {day5SectionLabel(section)}
                </h3>
                <div className="rounded-md border bg-white p-3">
                  <PreviewComponent
                    content={readOnlySections[section]}
                    emptyPlaceholder="No response provided for this section."
                  />
                </div>
              </section>
            ))
          ) : (
            <div className="rounded-md border bg-white p-3">
              <PreviewComponent
                content={readOnlyFallbackMarkdown}
                emptyPlaceholder="No finalized reflection content is available."
              />
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <span className="leading-5">
                Each section is required and must include at least{' '}
                {String(DAY5_REFLECTION_MIN_SECTION_CHARS)} characters.
              </span>
            </div>
            <div className="inline-flex overflow-hidden rounded-md border border-gray-200 bg-white text-xs font-medium">
              <button
                type="button"
                aria-pressed={mode === 'write'}
                className={
                  mode === 'write'
                    ? 'bg-blue-50 px-3 py-1 text-blue-700 transition-colors'
                    : 'px-3 py-1 text-gray-700 transition-colors hover:bg-gray-50'
                }
                onClick={() => setMode('write')}
              >
                Write
              </button>
              <button
                type="button"
                aria-pressed={mode === 'preview'}
                className={
                  mode === 'preview'
                    ? 'border-l border-gray-200 bg-blue-50 px-3 py-1 text-blue-700 transition-colors'
                    : 'border-l border-gray-200 px-3 py-1 text-gray-700 transition-colors hover:bg-gray-50'
                }
                onClick={() => setMode('preview')}
              >
                Preview
              </button>
            </div>
          </div>

          {mode === 'preview' ? (
            <div className="min-h-[360px] rounded-md border bg-white p-3">
              <PreviewComponent
                content={markdownPreview}
                emptyPlaceholder="Complete each reflection section to preview markdown."
              />
            </div>
          ) : (
            DAY5_REFLECTION_SECTIONS.map((section) => {
              const fieldId = `reflection-${section}`;
              const shouldShowClientError = submitAttempted || touched[section];
              const fieldError =
                backendFieldErrors[section] ??
                (shouldShowClientError ? clientFieldMessages[section] : null);
              const length = sections[section].trim().length;
              return (
                <section key={section} className="space-y-2">
                  <label
                    htmlFor={fieldId}
                    className="block text-sm font-semibold text-gray-900"
                  >
                    {day5SectionLabel(section)}
                  </label>
                  <textarea
                    id={fieldId}
                    value={sections[section]}
                    onChange={(event) =>
                      handleSectionChange(section, event.target.value)
                    }
                    onBlur={() =>
                      setTouched((prev) => ({ ...prev, [section]: true }))
                    }
                    className="min-h-[120px] w-full resize-y rounded-md border p-3 text-sm leading-6"
                    placeholder={`Write your ${day5SectionLabel(section).toLowerCase()} reflection…`}
                    disabled={displayStatus !== 'idle' || submitting}
                  />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{length.toLocaleString()} characters</span>
                    <span>
                      Min {String(DAY5_REFLECTION_MIN_SECTION_CHARS)} characters
                    </span>
                  </div>
                  {fieldError ? (
                    <p className="text-xs text-red-700" role="alert">
                      {fieldError}
                    </p>
                  ) : null}
                </section>
              );
            })
          )}
          <div className="sticky bottom-2 z-20 mt-3 rounded-md border border-gray-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
            <DraftSaveStatus
              status={draftAutosave.status}
              lastSavedAt={draftAutosave.lastSavedAt}
              restoreApplied={draftAutosave.restoreApplied}
              error={draftAutosave.error}
            />
          </div>
        </div>
      )}

      {submittedTerminal ? (
        <div className="mt-4 rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-900">
          Submitted. Your Day 5 reflection is finalized.
        </div>
      ) : null}

      <TaskStatus displayStatus={displayStatus} progress={lastProgress} />
      <TaskPanelErrorBanner message={errorToShow} />

      {!readOnly ? (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onSaveDraft}
              className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-50"
              disabled={displayStatus !== 'idle' || submitting}
            >
              Save draft
            </button>
            <Button disabled={submitDisabled} onClick={onSubmitReflection}>
              {displayStatus === 'submitting'
                ? 'Submitting…'
                : displayStatus === 'submitted'
                  ? 'Submitted ✓'
                  : 'Submit & Continue'}
            </Button>
          </div>
          {hasClientValidationErrors ? (
            <p className="text-xs text-gray-600">
              Complete all sections with at least{' '}
              {String(DAY5_REFLECTION_MIN_SECTION_CHARS)} characters to submit.
            </p>
          ) : null}
        </div>
      ) : null}
    </TaskContainer>
  );
}
