import { screen, waitFor } from '@testing-library/react';
import {
  baseTask,
  getCandidateTaskDraftMock,
  primeDraftMocks,
  renderTaskView,
} from './CandidateTaskView.testlib';

describe('CandidateTaskView task-type panel routing', () => {
  beforeEach(() => {
    primeDraftMocks();
  });

  it('routes day 5 documentation to the markdown reflection editor', async () => {
    getCandidateTaskDraftMock.mockResolvedValue({
      taskId: 5,
      contentText: null,
      contentJson: {
        reflectionMarkdown:
          '# Reflection\n\nRecovered challenge notes\n\nRecovered tradeoff notes',
      },
      updatedAt: '2026-03-07T09:30:00.000Z',
      finalizedAt: null,
      finalizedSubmissionId: null,
    });
    renderTaskView({
      task: {
        ...baseTask,
        id: 5,
        dayIndex: 5,
        type: 'documentation',
        title: 'Reflection',
      },
    });
    await waitFor(() =>
      expect(
        (screen.getByRole('textbox') as HTMLTextAreaElement).value,
      ).toContain('Recovered challenge notes'),
    );
    expect(
      (screen.getByRole('textbox') as HTMLTextAreaElement).value,
    ).toContain('Recovered tradeoff notes');
    expect(
      screen.queryByRole('button', { name: /preview/i }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/challenges/i)).toBeNull();
  });

  it('keeps non-day5 docs on generic text panel', () => {
    renderTaskView({
      task: {
        ...baseTask,
        id: 11,
        dayIndex: 1,
        type: 'documentation',
        title: 'Documentation',
      },
    });
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.queryByLabelText(/challenges/i)).toBeNull();
  });

  it('routes handoff tasks to the upload panel', () => {
    renderTaskView({
      task: {
        ...baseTask,
        id: 44,
        dayIndex: 4,
        type: 'handoff',
        title: 'Handoff upload',
      },
    });
    expect(screen.getByTestId('handoff-upload-panel')).toHaveTextContent(
      'Handoff upload',
    );
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('keeps day4 reflection-like documentation on generic text panel', () => {
    renderTaskView({
      task: {
        ...baseTask,
        id: 12,
        dayIndex: 4,
        type: 'documentation',
        title: 'Reflection',
        description: 'Document your approach.',
        recordedSubmission: {
          submissionId: 1202,
          submittedAt: '2026-03-07T12:00:00.000Z',
          contentText: 'Canonical markdown text',
          contentJson: {
            kind: 'day5_reflection',
            sections: { challenges: 'Should not trigger day 5 panel on day 4' },
          },
        },
      },
    });
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.queryByLabelText(/challenges/i)).toBeNull();
  });
});
