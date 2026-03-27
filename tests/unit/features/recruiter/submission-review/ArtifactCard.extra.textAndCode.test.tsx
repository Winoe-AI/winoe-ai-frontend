import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  ArtifactCard,
  buildArtifact,
} from './CandidateSubmissionsPage.extra.testlib';

describe('ArtifactCard extra coverage - text and code blocks', () => {
  it('renders text submission with expand/collapse', () => {
    const longText = 'x'.repeat(400);
    const artifact = buildArtifact(1, 1, {
      contentText: longText,
      task: {
        taskId: 1,
        dayIndex: 1,
        type: 'text',
        title: 'Text Task',
        prompt: 'Write something',
      },
    });
    render(<ArtifactCard artifact={artifact} />);

    expect(screen.getByText(/Text answer/)).toBeInTheDocument();
    expect(screen.getByText(/Prompt/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Expand/i }));
    expect(screen.getByTestId('md-preview')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Collapse/i }));
  });

  it('renders code task with GitHub artifacts', () => {
    const artifact = buildArtifact(1, 2, {
      repoUrl: 'https://github.com/tenon/repo',
      repoFullName: 'tenon/repo',
      workflowUrl: 'http://workflow',
      commitUrl: 'http://commit',
      diffUrl: 'http://diff',
      diffSummary: { files: 3, additions: 100 },
      testResults: {
        passed: 5,
        failed: 1,
        total: 6,
        stdout: 'test output',
        stderr: 'error output',
        stdoutTruncated: false,
        stderrTruncated: false,
        runId: 'run-1',
        workflowRunId: 'wf-1',
        runStatus: 'completed',
        conclusion: 'failure',
        timeout: false,
        summary: { failures: ['test1'] },
        commitUrl: null,
        workflowUrl: null,
      },
    });
    render(<ArtifactCard artifact={artifact} />);

    expect(screen.getAllByText(/GitHub artifacts/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Repository/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/tenon\/repo/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Test results/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Failed/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Diff summary/).length).toBeGreaterThan(0);
  });
});
