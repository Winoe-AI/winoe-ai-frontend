'use client';

import { TaskTextInput } from './TaskTextInput';

type TaskWorkAreaProps = {
  githubNative: boolean;
  readOnly: boolean;
  disabledReason: string | null;
  text: string;
  disabled: boolean;
  savedAt: number | null;
  onChangeText: (value: string) => void;
};

export function TaskWorkArea({
  githubNative,
  readOnly,
  disabledReason,
  text,
  disabled,
  savedAt,
  onChangeText,
}: TaskWorkAreaProps) {
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
