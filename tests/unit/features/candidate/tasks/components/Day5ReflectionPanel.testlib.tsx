import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { Day5ReflectionPanel } from '@/features/candidate/tasks/components/Day5ReflectionPanel';
import type { Task } from '@/features/candidate/tasks/types';
import { sampleDay5Markdown } from '../CandidateTaskView.testlib';
export { sampleDay5Markdown } from '../CandidateTaskView.testlib';

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
  title: 'Reflection Essay',
  description: 'Reflect on your full Trial experience.',
};

export function fillDay5Markdown() {
  fireEvent.change(screen.getByRole('textbox', { name: /markdown editor/i }), {
    target: {
      value: sampleDay5Markdown,
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
