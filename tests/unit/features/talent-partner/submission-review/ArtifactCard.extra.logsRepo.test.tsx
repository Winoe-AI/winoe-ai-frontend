import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  ArtifactCard,
  buildArtifact,
} from './CandidateSubmissionsPage.extra.testlib';

describe('ArtifactCard extra coverage - logs and repo links', () => {
  it('renders log viewer with toggle', () => {
    const artifact = buildArtifact(1, 2, {
      testResults: {
        passed: 1,
        failed: 0,
        total: 1,
        stdout: 'stdout content',
        stderr: 'stderr content',
        stdoutTruncated: true,
        stderrTruncated: false,
        runStatus: null,
        conclusion: 'success',
        timeout: false,
        workflowUrl: null,
        commitUrl: null,
      },
    });
    render(<ArtifactCard artifact={artifact} />);

    const viewButtons = screen.getAllByRole('button', { name: /View/i });
    fireEvent.click(viewButtons[0]);
    expect(screen.getByText(/stdout content/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Hide/i }));
  });

  it('handles Day 2/3 with repoPath as fullName', () => {
    const artifact = buildArtifact(1, 2, {
      repoUrl: null,
      repoFullName: null,
      code: { repoPath: 'owner/repo', repoFullName: null, repoUrl: null },
    });
    render(<ArtifactCard artifact={artifact} />);
    expect(screen.getAllByText(/owner\/repo/).length).toBeGreaterThan(0);
  });
});
