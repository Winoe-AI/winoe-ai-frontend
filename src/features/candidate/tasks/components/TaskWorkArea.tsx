'use client';

import { TaskTextInput } from './TaskTextInput';
import { Day1DesignDocWorkspace } from './Day1DesignDocWorkspace';

type TaskWorkAreaProps = {
  dayIndex: number;
  projectBrief: string;
  cutoffAt?: string | null;
  githubNative: boolean;
  readOnly: boolean;
  disabledReason: string | null;
  draftError: string | null;
  text: string;
  disabled: boolean;
  savedAt: number | null;
  onChangeText: (value: string) => void;
};

export function TaskWorkArea({
  dayIndex,
  projectBrief,
  cutoffAt,
  githubNative,
  readOnly,
  disabledReason,
  draftError,
  text,
  disabled,
  savedAt,
  onChangeText,
}: TaskWorkAreaProps) {
  if (!githubNative && dayIndex === 1) {
    return (
      <Day1DesignDocWorkspace
        projectBrief={projectBrief}
        value={text}
        disabled={disabled}
        readOnly={readOnly}
        readOnlyReason={disabledReason}
        draftError={draftError}
        savedAt={savedAt}
        cutoffAt={cutoffAt}
        onChange={onChangeText}
      />
    );
  }

  return (
    <div className="mt-6">
      {githubNative ? (
        readOnly ? (
          <div className="rounded-md border border-gray-300 bg-gray-100 p-3 text-sm text-gray-900">
            {disabledReason ??
              'This day is closed and read-only. Review your prompt and recorded submission details in the banner above.'}
          </div>
        ) : (
          <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
            Use your Codespace for all implementation work. When you’re ready,
            submit to move to the next day.
          </div>
        )
      ) : (
        <TaskTextInput
          value={text}
          onChange={onChangeText}
          disabled={disabled}
          readOnly={readOnly}
          readOnlyReason={disabledReason}
          savedAt={savedAt}
        />
      )}
    </div>
  );
}
