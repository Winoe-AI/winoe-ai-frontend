import { fireEvent, screen, waitFor } from '@testing-library/react';
import {
  fillAllSections,
  renderPanel,
  resetDay5PanelMocks,
} from './Day5ReflectionPanel.testlib';

describe('Day5ReflectionPanel submit flow', () => {
  beforeEach(() => {
    resetDay5PanelMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps submit disabled until all sections are valid', async () => {
    renderPanel();
    const submitButton = screen.getByRole('button', {
      name: /submit & continue/i,
    });
    expect(submitButton).toBeDisabled();
    fillAllSections();
    expect(submitButton).toBeEnabled();
  });

  it('submits structured reflection payload with markdown contentText', async () => {
    const onSubmit = jest.fn().mockResolvedValue({
      submissionId: 10,
      taskId: 5,
      candidateSessionId: 11,
      submittedAt: '2026-03-08T15:10:00.000Z',
      progress: { completed: 5, total: 5 },
      isComplete: true,
    });
    renderPanel({ onSubmit });

    fillAllSections();
    fireEvent.click(screen.getByRole('button', { name: /submit & continue/i }));

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
        contentText: expect.stringContaining('## Challenges'),
      }),
    );
    expect(
      await screen.findByText(
        /submitted\. your day 5 reflection is finalized/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /submit & continue/i }),
    ).toBeNull();
  });
});
