import { DAY5_REFLECTION_MIN_SECTION_CHARS } from '../../utils/day5Reflection';

type Props = {
  mode: 'write' | 'preview';
  onModeChange: (next: 'write' | 'preview') => void;
};

export function Day5ReflectionEditorToolbar({ mode, onModeChange }: Props) {
  return (
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
          onClick={() => onModeChange('write')}
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
          onClick={() => onModeChange('preview')}
        >
          Preview
        </button>
      </div>
    </div>
  );
}
