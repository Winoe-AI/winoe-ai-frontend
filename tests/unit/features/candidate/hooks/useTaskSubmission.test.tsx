import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { useTaskSubmission } from '@/features/candidate/session/hooks/useTaskSubmission';
import type { Task } from '@/features/candidate/tasks/types';

jest.mock('@/features/candidate/session/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/features/candidate/session/api'),
  submitCandidateTask: jest.fn(),
}));

const submitMock = jest.requireMock('@/features/candidate/session/api')
  .submitCandidateTask as jest.Mock;
type HarnessProps = {
  candidateSessionId: number | null;
  currentTask: Task | null;
  setTaskError: jest.Mock;
  clearTaskError: jest.Mock;
  refreshTask: jest.Mock;
  payload?: { contentText?: string };
};

function Harness({
  candidateSessionId,
  currentTask,
  setTaskError,
  clearTaskError,
  refreshTask,
  payload = { contentText: 'answer' },
}: HarnessProps) {
  const { submitting, handleSubmit } = useTaskSubmission({
    candidateSessionId,
    currentTask,
    clearTaskError,
    setTaskError,
    refreshTask,
  });

  return (
    <div>
      <div data-testid="submitting">{String(submitting)}</div>
      <button onClick={() => void handleSubmit(payload)}>submit</button>
    </div>
  );
}

describe('useTaskSubmission', () => {
  beforeEach(() => submitMock.mockReset());

  it('blocks empty text submissions', async () => {
    const setTaskError = jest.fn();
    render(
      <Harness
        candidateSessionId={5}
        currentTask={{
          id: 1,
          dayIndex: 1,
          type: 'documentation',
          title: 'Docs',
          description: '',
        }}
        setTaskError={setTaskError}
        clearTaskError={jest.fn()}
        refreshTask={jest.fn()}
        payload={{ contentText: ' ' }}
      />,
    );
    await act(async () => screen.getByText('submit').click());
    expect(setTaskError).toHaveBeenCalled();
    expect(submitMock).not.toHaveBeenCalled();
  });

  it('submits and schedules refresh', async () => {
    const refreshTask = jest.fn();
    submitMock.mockResolvedValue({ ok: true });
    jest.useFakeTimers();
    render(
      <Harness
        candidateSessionId={5}
        currentTask={{
          id: 1,
          dayIndex: 1,
          type: 'design',
          title: 'Design',
          description: '',
        }}
        setTaskError={jest.fn()}
        clearTaskError={jest.fn()}
        refreshTask={refreshTask}
      />,
    );
    await act(async () => screen.getByText('submit').click());
    expect(submitMock).toHaveBeenCalledWith({
      taskId: 1,
      candidateSessionId: 5,
      contentText: 'answer',
    });
    await act(async () => jest.runAllTimers());
    expect(refreshTask).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('submits GitHub-native tasks without code or text payloads', async () => {
    const setTaskError = jest.fn();
    submitMock.mockResolvedValue({ ok: true });
    render(
      <Harness
        candidateSessionId={12}
        currentTask={{
          id: 12,
          dayIndex: 2,
          type: 'code',
          title: 'Day 2',
          description: '',
        }}
        setTaskError={setTaskError}
        clearTaskError={jest.fn()}
        refreshTask={jest.fn()}
        payload={{}}
      />,
    );
    await act(async () => screen.getByText('submit').click());
    expect(setTaskError).not.toHaveBeenCalled();
    expect(submitMock).toHaveBeenCalledWith({
      taskId: 12,
      candidateSessionId: 12,
      contentText: undefined,
    });
  });
});
