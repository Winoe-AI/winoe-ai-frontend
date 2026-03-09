import React from 'react';
import { render, screen } from '@testing-library/react';
import { TaskStatus } from '@/features/candidate/session/task/components/TaskStatus';

describe('TaskStatus', () => {
  it('renders submitting state', () => {
    render(<TaskStatus displayStatus="submitting" progress={null} />);
    expect(screen.getByText(/Submitting/)).toBeInTheDocument();
  });

  it('renders submitted with progress', () => {
    render(
      <TaskStatus
        displayStatus="submitted"
        progress={{ completed: 3, total: 5 }}
      />,
    );
    expect(
      screen.getByText(/Progress: 3\/5/, { exact: false }),
    ).toBeInTheDocument();
  });

  it('renders submitted without progress details', () => {
    render(<TaskStatus displayStatus="submitted" progress={null} />);
    expect(screen.getByText(/Submitted/)).toBeInTheDocument();
    expect(screen.queryByText(/Progress:/)).toBeNull();
  });

  it('renders custom recorded label and sha when provided', () => {
    render(
      <TaskStatus
        displayStatus="submitted"
        progress={{ completed: 1, total: 2 }}
        submittedLabel="Checkpoint recorded"
        submittedShaLabel="Checkpoint SHA"
        submittedSha="abcdef123456"
      />,
    );
    expect(screen.getByText(/Checkpoint recorded/)).toBeInTheDocument();
    expect(screen.getByText(/Progress: 1\/2/)).toBeInTheDocument();
    expect(screen.getByText(/Checkpoint SHA:/)).toBeInTheDocument();
    expect(screen.getByText(/abcdef1/)).toBeInTheDocument();
  });

  it('renders nothing when idle', () => {
    render(<TaskStatus displayStatus="idle" progress={null} />);
    expect(screen.queryByText(/Submitting/i)).toBeNull();
    expect(screen.queryByText(/Submitted/i)).toBeNull();
  });
});
