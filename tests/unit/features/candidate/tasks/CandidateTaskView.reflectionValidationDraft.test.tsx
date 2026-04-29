import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {
  baseTask,
  fillDay5Markdown,
  getCandidateTaskDraftMock,
  primeDraftMocks,
  putCandidateTaskDraftMock,
  renderTaskView,
  sampleDay5Markdown,
} from './CandidateTaskView.testlib';

describe('CandidateTaskView reflection validation and editable draft behavior', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    primeDraftMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('opens confirmation and submits the Day 5 reflection payload', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    renderTaskView({
      task: {
        ...baseTask,
        id: 5,
        dayIndex: 5,
        type: 'documentation',
        title: 'Reflection Essay',
        description: 'Reflect on your full Trial experience.',
      },
      onSubmit,
    });

    await screen.findByRole('heading', { name: /reflection essay editor/i });
    fillDay5Markdown();
    fireEvent.click(
      screen.getByRole('button', { name: /submit reflection essay/i }),
    );
    fireEvent.click(
      within(
        screen.getByRole('dialog', {
          name: /submit your reflection essay/i,
        }),
      ).getByRole('button', { name: /submit reflection essay/i }),
    );
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        reflection: expect.objectContaining({
          challenges: expect.any(String),
          decisions: expect.any(String),
          tradeoffs: expect.any(String),
          communication: expect.any(String),
          next: expect.any(String),
        }),
        contentText: sampleDay5Markdown,
      }),
    );
    expect(
      await screen.findByText(/your 5-day trial is complete/i),
    ).toBeInTheDocument();
  });

  it('keeps draft restore and autosave active for editable drafts', async () => {
    getCandidateTaskDraftMock.mockResolvedValue({
      taskId: 5,
      contentText: null,
      contentJson: {
        reflection: {
          challenges: 'Recovered editable draft',
          decisions: 'Recovered decisions',
          tradeoffs: 'Recovered tradeoffs',
          communication: 'Recovered communication',
          next: 'Recovered next',
        },
      },
      updatedAt: '2026-03-07T09:00:00.000Z',
      finalizedAt: null,
      finalizedSubmissionId: null,
    });
    renderTaskView({
      task: {
        ...baseTask,
        id: 5,
        dayIndex: 5,
        type: 'documentation',
        title: 'Reflection Essay',
        description: 'Reflect on your full Trial experience.',
      },
      actionGate: { isReadOnly: false, disabledReason: null, comeBackAt: null },
    });
    await waitFor(() =>
      expect(
        screen.getByDisplayValue(/Recovered editable draft/),
      ).toBeInTheDocument(),
    );
    fireEvent.change(
      screen.getByRole('textbox', { name: /markdown editor/i }),
      {
        target: { value: 'Keep editing' },
      },
    );
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    expect(putCandidateTaskDraftMock).toHaveBeenCalledTimes(1);
  });
});
