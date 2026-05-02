import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import {
  TECH_TRIAL_DAY_SUMMARY,
  TRIAL_COMPLETION_COPY,
} from '@/features/candidate/session/views/completeView.copy';
import {
  baseTask,
  fillDay5Markdown,
  renderPanel,
  resetDay5PanelMocks,
} from './Day5ReflectionPanel.testlib';

describe('Day5ReflectionPanel validation and read-only states', () => {
  beforeEach(() => {
    resetDay5PanelMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('surfaces backend validation errors for the markdown essay', async () => {
    const onSubmit = jest.fn().mockRejectedValue({
      status: 422,
      details: {
        errorCode: 'VALIDATION_ERROR',
        details: { fields: { 'reflection.communication': ['too_short'] } },
      },
    });
    renderPanel({
      submitError: 'Submission payload validation failed',
      onSubmit,
    });

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

    await waitFor(() => {
      expect(
        screen.getByText(
          /please complete the reflection essay before submitting/i,
        ),
      ).toBeInTheDocument();
    });
  });

  it('renders congratulations when the backend reports completion', () => {
    renderPanel({
      task: {
        ...baseTask,
        recordedSubmission: {
          submissionId: 99,
          submittedAt: '2026-03-08T15:20:00.000Z',
          contentText:
            '## Experience & Challenges\nCanonical finalized markdown from backend',
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
      },
      actionGate: {
        isReadOnly: true,
        disabledReason: 'Day closed.',
        comeBackAt: null,
      },
    });

    expect(screen.getByText(TRIAL_COMPLETION_COPY)).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(
      screen.queryByRole('button', { name: /submit reflection essay/i }),
    ).toBeNull();
    expect(screen.getByText(TECH_TRIAL_DAY_SUMMARY[0])).toBeInTheDocument();
  });
});
