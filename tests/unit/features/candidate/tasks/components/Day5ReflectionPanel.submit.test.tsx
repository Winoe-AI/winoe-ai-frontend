import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import {
  fillDay5Markdown,
  renderPanel,
  resetDay5PanelMocks,
  sampleDay5Markdown,
} from './Day5ReflectionPanel.testlib';

describe('Day5ReflectionPanel submit flow', () => {
  beforeEach(() => {
    resetDay5PanelMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows a single markdown editor and keeps submit disabled for scaffold-only content', () => {
    renderPanel();
    expect(
      screen.getByRole('textbox', { name: /markdown editor/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /submit reflection essay/i }),
    ).toBeDisabled();
    expect(
      screen.getByText(/add reflection text before submitting/i),
    ).toBeInTheDocument();
  });

  it('enables submit after body content is written and opens confirmation', () => {
    renderPanel();
    fireEvent.change(
      screen.getByRole('textbox', { name: /markdown editor/i }),
      {
        target: {
          value: sampleDay5Markdown,
        },
      },
    );
    expect(
      screen.getByRole('button', { name: /submit reflection essay/i }),
    ).toBeEnabled();
    fireEvent.click(
      screen.getByRole('button', { name: /submit reflection essay/i }),
    );
    expect(
      screen.getByRole('dialog', {
        name: /submit your reflection essay/i,
      }),
    ).toBeInTheDocument();
  });

  it('submits structured reflection payload with exact markdown contentText', async () => {
    const onSubmit = jest.fn().mockResolvedValue({
      submissionId: 10,
      taskId: 5,
      candidateSessionId: 11,
      submittedAt: '2026-03-08T15:10:00.000Z',
      progress: { completed: 5, total: 5 },
      isComplete: true,
    });
    renderPanel({ onSubmit });

    fillDay5Markdown();
    fireEvent.click(
      screen.getByRole('button', { name: /submit reflection essay/i }),
    );
    const dialog = screen.getByRole('dialog', {
      name: /submit your reflection essay/i,
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: /submit reflection essay/i }),
    );

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
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
    expect(
      screen.queryByRole('button', { name: /submit reflection essay/i }),
    ).toBeNull();
  });
});
