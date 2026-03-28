import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  ArtifactCard,
  buildArtifact,
} from './CandidateSubmissionsPage.extra.testlib';

describe('ArtifactCard extra coverage - statuses', () => {
  it('renders test results with different statuses', () => {
    const runningArtifact = buildArtifact(1, 2, {
      testResults: {
        passed: null,
        failed: null,
        total: null,
        stdout: null,
        stderr: null,
        runStatus: 'in_progress',
        conclusion: null,
        timeout: false,
        workflowUrl: null,
        commitUrl: null,
      },
    });
    const { rerender } = render(<ArtifactCard artifact={runningArtifact} />);
    expect(screen.getByText(/Running/)).toBeInTheDocument();

    rerender(
      <ArtifactCard
        artifact={buildArtifact(1, 2, {
          testResults: {
            passed: null,
            failed: null,
            total: null,
            stdout: null,
            stderr: null,
            runStatus: null,
            conclusion: null,
            timeout: true,
            workflowUrl: null,
            commitUrl: null,
          },
        })}
      />,
    );
    expect(screen.getAllByText(/Timed out/).length).toBeGreaterThan(0);

    rerender(
      <ArtifactCard
        artifact={buildArtifact(1, 2, {
          testResults: {
            passed: null,
            failed: null,
            total: null,
            stdout: null,
            stderr: null,
            runStatus: null,
            conclusion: 'success',
            timeout: false,
            workflowUrl: null,
            commitUrl: null,
          },
        })}
      />,
    );
    expect(screen.getByText(/Passed/)).toBeInTheDocument();

    rerender(
      <ArtifactCard
        artifact={buildArtifact(1, 2, {
          testResults: {
            passed: 10,
            failed: 0,
            total: 10,
            stdout: null,
            stderr: null,
            runStatus: null,
            conclusion: null,
            timeout: false,
            workflowUrl: null,
            commitUrl: null,
          },
        })}
      />,
    );
    expect(screen.getAllByText(/Passed/).length).toBeGreaterThan(0);
  });
});
