import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import {
  baseTask,
  fillAllSections,
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

  it('maps backend validation errors to inline section fields', async () => {
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

    fillAllSections();
    fireEvent.click(screen.getByRole('button', { name: /submit & continue/i }));

    await waitFor(() => {
      const communicationField = screen.getByLabelText(/communication/i);
      const section = communicationField.closest('section');
      expect(section).not.toBeNull();
      expect(within(section as HTMLElement).getByText(/add at least 20 characters/i)).toBeInTheDocument();
    });
  });

  it('renders canonical read-only markdown when day is closed', () => {
    renderPanel({
      task: {
        ...baseTask,
        recordedSubmission: {
          submissionId: 99,
          submittedAt: '2026-03-08T15:20:00.000Z',
          contentText: '## Challenges\nCanonical finalized markdown from backend',
          contentJson: {
            kind: 'day5_reflection',
            sections: {
              challenges: 'Structured challenges should not be preferred.',
              decisions: 'Chose explicit schemas and stable payloads for reliability.',
              tradeoffs: 'Accepted stricter constraints for better scoring consistency.',
              communication: 'Shared risks and updates clearly across implementation stages.',
              next: 'Would add richer evidence links and evaluator-facing summaries.',
            },
          },
        },
      },
      actionGate: { isReadOnly: true, disabledReason: 'Day closed.', comeBackAt: null },
    });

    expect(screen.getByText(/day closed/i)).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button', { name: /submit & continue/i })).toBeNull();
    expect(screen.getByText(/canonical finalized markdown from backend/i)).toBeInTheDocument();
    expect(screen.queryByText(/structured challenges should not be preferred/i)).toBeNull();
  });
});
