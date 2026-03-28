import type { ComponentProps } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { Task } from '@/features/candidate/tasks/types';

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
jest.mock('@/features/candidate/tasks/handoff/HandoffUploadPanel', () => ({
  HandoffUploadPanel: ({ task }: { task: { title: string } }) => (
    <div data-testid="handoff-upload-panel">{task.title}</div>
  ),
}));

export const CandidateTaskView = (
  jest.requireActual('@/features/candidate/tasks/CandidateTaskView') as {
    default: (props: {
      candidateSessionId: number;
      task: Task;
      submitting: boolean;
      submitError: string | null;
      onSubmit: (...args: unknown[]) => Promise<unknown> | unknown;
      actionGate?: {
        isReadOnly: boolean;
        disabledReason: string | null;
        comeBackAt: string | null;
      };
    }) => React.JSX.Element;
  }
).default;

type CandidateTaskViewProps = ComponentProps<typeof CandidateTaskView>;

export const baseTask: Task = {
  id: 1,
  dayIndex: 1,
  type: 'design',
  title: 'Design doc',
  description: 'Write a design doc',
};

export const primeDraftMocks = () => {
  jest.clearAllMocks();
  getCandidateTaskDraftMock.mockResolvedValue(null);
  putCandidateTaskDraftMock.mockResolvedValue({
    taskId: 1,
    updatedAt: '2026-03-07T10:00:00.000Z',
  });
};

export const renderTaskView = (
  overrides: Partial<CandidateTaskViewProps> = {},
) => {
  const onSubmit = overrides.onSubmit ?? jest.fn();
  render(
    <CandidateTaskView
      candidateSessionId={22}
      task={baseTask}
      submitting={false}
      submitError={null}
      onSubmit={onSubmit}
      {...overrides}
    />,
  );
  return { onSubmit };
};

export const fillAllReflectionSections = () => {
  fireEvent.change(screen.getByLabelText(/challenges/i), {
    target: {
      value:
        'Handled ambiguous requirements by validating assumptions early in the flow.',
    },
  });
  fireEvent.change(screen.getByLabelText(/^decisions$/i), {
    target: {
      value:
        'Chose deterministic contracts so UI and backend validation align.',
    },
  });
  fireEvent.change(screen.getByLabelText(/tradeoffs/i), {
    target: {
      value:
        'Accepted stricter rules to improve evaluation consistency across candidates.',
    },
  });
  fireEvent.change(screen.getByLabelText(/communication/i), {
    target: {
      value:
        'Documented risks and handoff notes clearly at each implementation milestone.',
    },
  });
  fireEvent.change(screen.getByLabelText(/what you would do next/i), {
    target: {
      value:
        'Next I would add rubric-linked evidence references and quality checks.',
    },
  });
};
