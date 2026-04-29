import { DraftSaveStatus } from '../DraftSaveStatus';
import type { Day5ReflectionEditableViewProps } from './day5ReflectionEditable.types';

export function Day5ReflectionEditableView({
  mode,
  previewPending,
  markdown,
  markdownPreview,
  displayStatus,
  submitting,
  draftAutosave,
  PreviewComponent,
  onModeChange,
  onMarkdownChange,
}: Day5ReflectionEditableViewProps) {
  return (
    <section aria-labelledby="day5-editor-heading" className="mt-6 space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2
            id="day5-editor-heading"
            className="text-lg font-semibold text-gray-950"
          >
            Reflection Essay editor
          </h2>
          <p className="text-sm text-gray-600">
            Write one markdown essay. The preview updates live so you can check
            headings, structure, and emphasis before submitting.
          </p>
        </div>
        <div className="inline-flex overflow-hidden rounded-md border border-gray-200 bg-white text-xs font-medium">
          <button
            type="button"
            aria-pressed={mode === 'write'}
            className={
              mode === 'write'
                ? 'bg-sky-50 px-3 py-1 text-sky-700'
                : 'px-3 py-1 text-gray-700 hover:bg-gray-50'
            }
            onClick={() => onModeChange('write')}
          >
            Write
          </button>
          <button
            type="button"
            aria-pressed={mode === 'preview'}
            className={
              mode === 'preview'
                ? 'border-l border-gray-200 bg-sky-50 px-3 py-1 text-sky-700'
                : 'border-l border-gray-200 px-3 py-1 text-gray-700 hover:bg-gray-50'
            }
            onClick={() => onModeChange('preview')}
          >
            Preview
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-gray-800">
            Markdown editor
          </span>
          <textarea
            className="min-h-[520px] w-full resize-y rounded-md border border-gray-300 bg-white p-4 text-sm leading-6 text-gray-950 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 disabled:bg-gray-100 disabled:text-gray-600"
            value={markdown}
            onChange={(event) => onMarkdownChange(event.target.value)}
            disabled={displayStatus !== 'idle' || submitting}
            placeholder="Write your Day 5 reflection essay in markdown."
          />
        </label>
        <div>
          <p className="mb-2 text-sm font-medium text-gray-800">Live preview</p>
          <div className="min-h-[520px] rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            {previewPending ? (
              <div className="mb-2 text-xs text-gray-500">
                Refreshing preview…
              </div>
            ) : null}
            <PreviewComponent
              content={markdownPreview}
              emptyPlaceholder="Start writing to preview your reflection essay."
            />
          </div>
        </div>
      </div>

      <div className="sticky bottom-2 z-20 rounded-md border border-gray-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
        <DraftSaveStatus
          status={draftAutosave.status}
          lastSavedAt={draftAutosave.lastSavedAt}
          restoreApplied={draftAutosave.restoreApplied}
          error={draftAutosave.error}
        />
      </div>
    </section>
  );
}
