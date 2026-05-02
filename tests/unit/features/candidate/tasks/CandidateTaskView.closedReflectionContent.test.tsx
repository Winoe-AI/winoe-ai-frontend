import { screen, waitFor } from '@testing-library/react';
import { TRIAL_COMPLETION_COPY } from '@/features/candidate/session/views/completeView.copy';
import {
  baseTask,
  getCandidateTaskDraftMock,
  primeDraftMocks,
  renderTaskView,
} from './CandidateTaskView.testlib';

describe('CandidateTaskView finalized day5 reflection rendering', () => {
  beforeEach(() => {
    primeDraftMocks();
  });

  it('renders congratulations when day 5 is finalized', async () => {
    renderTaskView({
      task: {
        ...baseTask,
        id: 5,
        dayIndex: 5,
        type: 'documentation',
        recordedSubmission: {
          submissionId: 101,
          submittedAt: '2026-03-07T12:00:00.000Z',
          contentText: '',
          contentJson: {
            kind: 'day5_reflection',
            sections: {
              challenges: 'Final challenges',
              decisions: 'Final decisions',
              tradeoffs: 'Final tradeoffs',
              communication: 'Final communication',
              next: 'Final next',
            },
          },
        },
      },
      actionGate: {
        isReadOnly: true,
        disabledReason: 'Day closed.',
        comeBackAt: null,
      },
    });
    await waitFor(() =>
      expect(screen.getByText(TRIAL_COMPLETION_COPY)).toBeInTheDocument(),
    );
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getByText(TRIAL_COMPLETION_COPY)).toBeInTheDocument();
    expect(getCandidateTaskDraftMock).not.toHaveBeenCalled();
  });

  it('keeps the congratulations screen when both text and structured content exist', async () => {
    renderTaskView({
      task: {
        ...baseTask,
        id: 5,
        dayIndex: 5,
        type: 'documentation',
        recordedSubmission: {
          submissionId: 102,
          submittedAt: '2026-03-07T12:00:00.000Z',
          contentText: 'Finalized text body',
          contentJson: {
            kind: 'day5_reflection',
            sections: {
              challenges: 'Structured challenges body',
              decisions: 'Structured decisions body',
              tradeoffs: 'Structured tradeoffs body',
              communication: 'Structured communication body',
              next: 'Structured next body',
            },
          },
        },
      },
      actionGate: {
        isReadOnly: true,
        disabledReason: 'Day closed.',
        comeBackAt: null,
      },
    });
    await waitFor(() =>
      expect(screen.getByText(TRIAL_COMPLETION_COPY)).toBeInTheDocument(),
    );
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(getCandidateTaskDraftMock).not.toHaveBeenCalled();
  });
});
