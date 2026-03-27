import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { Day5ReflectionPanel } from '@/features/candidate/tasks/components/Day5ReflectionPanel';
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

export const baseTask: Task = {
  id: 5,
  dayIndex: 5,
  type: 'documentation',
  title: 'Reflection',
  description: 'Submit your structured reflection.',
};

export function fillAllSections() {
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
}

export function renderPanel(
  overrides?: Partial<ComponentProps<typeof Day5ReflectionPanel>>,
) {
  return render(
    <Day5ReflectionPanel
      candidateSessionId={11}
      task={baseTask}
      submitting={false}
      submitError={null}
      actionGate={{ isReadOnly: false, disabledReason: null, comeBackAt: null }}
      onSubmit={jest.fn()}
      {...overrides}
    />,
  );
}

export function resetDay5PanelMocks() {
  jest.useFakeTimers();
  jest.clearAllMocks();
  getCandidateTaskDraftMock.mockResolvedValue(null);
  putCandidateTaskDraftMock.mockResolvedValue({
    taskId: 5,
    updatedAt: '2026-03-08T15:00:00.000Z',
  });
}
