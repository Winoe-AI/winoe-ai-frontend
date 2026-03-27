import { DraftSaveStatus } from '../DraftSaveStatus';
import {
  DAY5_REFLECTION_SECTIONS,
} from '../../utils/day5Reflection';
import { Day5ReflectionEditorToolbar } from './Day5ReflectionEditorToolbar';
import { Day5ReflectionSectionField } from './Day5ReflectionSectionField';
import type { Day5ReflectionEditableViewProps } from './day5ReflectionEditable.types';

export function Day5ReflectionEditableView({
  mode,
  previewPending,
  markdownPreview,
  submitAttempted,
  touched,
  backendFieldErrors,
  clientFieldMessages,
  sections,
  displayStatus,
  submitting,
  draftAutosave,
  PreviewComponent,
  onModeChange,
  onSectionChange,
  onSectionBlur,
}: Day5ReflectionEditableViewProps) {
  return (
    <div className="mt-6 space-y-4">
      <Day5ReflectionEditorToolbar mode={mode} onModeChange={onModeChange} />

      {mode === 'preview' ? (
        <div className="min-h-[360px] rounded-md border bg-white p-3">
          {previewPending ? (
            <div className="mb-2 text-xs text-gray-500">Refreshing preview…</div>
          ) : null}
          <PreviewComponent
            content={markdownPreview}
            emptyPlaceholder="Complete each reflection section to preview markdown."
          />
        </div>
      ) : (
        DAY5_REFLECTION_SECTIONS.map((section) => {
          const shouldShowClientError = submitAttempted || touched[section];
          const fieldError =
            backendFieldErrors[section] ??
            (shouldShowClientError ? clientFieldMessages[section] : null) ??
            null;
          return (
            <Day5ReflectionSectionField
              key={section}
              section={section}
              value={sections[section]}
              fieldError={fieldError}
              disabled={displayStatus !== 'idle' || submitting}
              onChange={onSectionChange}
              onBlur={onSectionBlur}
            />
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
  );
}
