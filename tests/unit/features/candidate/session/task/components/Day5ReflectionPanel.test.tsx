import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { Day5ReflectionPanel } from '@/features/candidate/session/task/components/Day5ReflectionPanel';
import type { Task } from '@/features/candidate/session/task/types';

const getCandidateTaskDraftMock = jest.fn();
const putCandidateTaskDraftMock = jest.fn();

jest.mock('@/features/candidate/api', () => {
  const actual = jest.requireActual('@/features/candidate/api');
  return {
    ...actual,
    getCandidateTaskDraft: (...args: unknown[]) =>
      getCandidateTaskDraftMock(...args),
    putCandidateTaskDraft: (...args: unknown[]) =>
      putCandidateTaskDraftMock(...args),
  };
});

const baseTask: Task = {
  id: 5,
  dayIndex: 5,
  type: 'documentation',
  title: 'Reflection',
  description: 'Submit your structured reflection.',
};

function fillAllSections() {
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

describe('Day5ReflectionPanel', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    getCandidateTaskDraftMock.mockResolvedValue(null);
    putCandidateTaskDraftMock.mockResolvedValue({
      taskId: 5,
      updatedAt: '2026-03-08T15:00:00.000Z',
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps submit disabled until all sections are valid', async () => {
    render(
      <Day5ReflectionPanel
        candidateSessionId={11}
        task={baseTask}
        submitting={false}
        submitError={null}
        actionGate={{
          isReadOnly: false,
          disabledReason: null,
          comeBackAt: null,
        }}
        onSubmit={jest.fn()}
      />,
    );

    const submitButton = screen.getByRole('button', {
      name: /submit & continue/i,
    });
    expect(submitButton).toBeDisabled();

    fillAllSections();

    expect(submitButton).toBeEnabled();
  });

  it('submits structured reflection payload with contentText markdown', async () => {
    const onSubmit = jest.fn().mockResolvedValue({
      submissionId: 10,
      taskId: 5,
      candidateSessionId: 11,
      submittedAt: '2026-03-08T15:10:00.000Z',
      progress: { completed: 5, total: 5 },
      isComplete: true,
    });

    render(
      <Day5ReflectionPanel
        candidateSessionId={11}
        task={baseTask}
        submitting={false}
        submitError={null}
        actionGate={{
          isReadOnly: false,
          disabledReason: null,
          comeBackAt: null,
        }}
        onSubmit={onSubmit}
      />,
    );

    fillAllSections();
    fireEvent.click(screen.getByRole('button', { name: /submit & continue/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        reflection: expect.objectContaining({
          challenges: expect.any(String),
          decisions: expect.any(String),
          tradeoffs: expect.any(String),
          communication: expect.any(String),
          next: expect.any(String),
        }),
        contentText: expect.stringContaining('## Challenges'),
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/submitted\. your day 5 reflection is finalized/i),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByRole('button', { name: /submit & continue/i }),
    ).toBeNull();
  });

  it('maps backend validation errors to inline section fields', async () => {
    const onSubmit = jest.fn().mockRejectedValue({
      status: 422,
      details: {
        errorCode: 'VALIDATION_ERROR',
        details: {
          fields: {
            'reflection.communication': ['too_short'],
          },
        },
      },
    });

    render(
      <Day5ReflectionPanel
        candidateSessionId={11}
        task={baseTask}
        submitting={false}
        submitError="Submission payload validation failed"
        actionGate={{
          isReadOnly: false,
          disabledReason: null,
          comeBackAt: null,
        }}
        onSubmit={onSubmit}
      />,
    );

    fillAllSections();
    fireEvent.click(screen.getByRole('button', { name: /submit & continue/i }));

    await waitFor(() => {
      const communicationField = screen.getByLabelText(/communication/i);
      const communicationSection = communicationField.closest('section');
      expect(communicationSection).not.toBeNull();
      expect(
        within(communicationSection as HTMLElement).getByText(
          /add at least 20 characters/i,
        ),
      ).toBeInTheDocument();
    });
  });

  it('renders read-only canonical markdown when day is closed and contentText exists', () => {
    render(
      <Day5ReflectionPanel
        candidateSessionId={11}
        task={{
          ...baseTask,
          recordedSubmission: {
            submissionId: 99,
            submittedAt: '2026-03-08T15:20:00.000Z',
            contentText:
              '## Challenges\nCanonical finalized markdown from backend',
            contentJson: {
              kind: 'day5_reflection',
              sections: {
                challenges: 'Structured challenges should not be preferred.',
                decisions:
                  'Chose explicit schemas and stable payloads for reliability.',
                tradeoffs:
                  'Accepted stricter constraints for better scoring consistency.',
                communication:
                  'Shared risks and updates clearly across implementation stages.',
                next: 'Would add richer evidence links and evaluator-facing summaries.',
              },
            },
          },
        }}
        submitting={false}
        submitError={null}
        actionGate={{
          isReadOnly: true,
          disabledReason: 'Day closed.',
          comeBackAt: null,
        }}
        onSubmit={jest.fn()}
      />,
    );

    expect(screen.getByText(/day closed/i)).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(
      screen.queryByRole('button', { name: /submit & continue/i }),
    ).toBeNull();
    expect(
      screen.getByText(/canonical finalized markdown from backend/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/structured challenges should not be preferred/i),
    ).toBeNull();
  });
});
