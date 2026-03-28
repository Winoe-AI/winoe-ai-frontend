import { renderHook } from '@testing-library/react';
import { useTaskDraftAutosave } from '@/features/candidate/tasks/hooks/useTaskDraftAutosave';
import type { CandidateTaskDraft } from '@/features/candidate/session/api';

export const getCandidateTaskDraftMock = jest.fn();
export const putCandidateTaskDraftMock = jest.fn();

jest.mock('@/features/candidate/session/api', () => {
  const actual = jest.requireActual('@/features/candidate/session/api');
  return {
    ...actual,
    getCandidateTaskDraft: (...args: unknown[]) =>
      getCandidateTaskDraftMock(...args),
    putCandidateTaskDraft: (...args: unknown[]) =>
      putCandidateTaskDraftMock(...args),
  };
});

type HookProps = {
  value: string;
  isEditable?: boolean;
  hasFinalizedContent?: boolean;
  deserialize?: (draft: CandidateTaskDraft) => string | null;
  onRestore?: (value: string) => void;
  onTaskWindowClosed?: (err: unknown) => void;
};

export function setupHook({
  value,
  isEditable = true,
  hasFinalizedContent = false,
  deserialize,
  onRestore,
  onTaskWindowClosed,
}: HookProps) {
  return renderHook(
    (props: HookProps) =>
      useTaskDraftAutosave<string>({
        taskId: 10,
        candidateSessionId: 44,
        isEditable: props.isEditable ?? true,
        hasFinalizedContent: props.hasFinalizedContent ?? false,
        value: props.value,
        serialize: (next) => ({ contentText: next }),
        deserialize:
          props.deserialize ?? ((draft) => draft.contentText ?? null),
        onRestore: props.onRestore ?? jest.fn(),
        onTaskWindowClosed: props.onTaskWindowClosed,
      }),
    {
      initialProps: {
        value,
        isEditable,
        hasFinalizedContent,
        deserialize,
        onRestore,
        onTaskWindowClosed,
      },
    },
  );
}

export function resetDraftAutosaveMocks() {
  jest.useFakeTimers();
  jest.clearAllMocks();
  getCandidateTaskDraftMock.mockResolvedValue(null);
  putCandidateTaskDraftMock.mockResolvedValue({
    taskId: 10,
    updatedAt: '2026-03-07T10:00:00.000Z',
  });
}
