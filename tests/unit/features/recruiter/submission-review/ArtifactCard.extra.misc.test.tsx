import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  ArtifactCard,
  buildArtifact,
} from './CandidateSubmissionsPage.extra.testlib';

describe('ArtifactCard extra coverage - misc', () => {
  it('handles code with http repoPath', () => {
    const artifact = buildArtifact(1, 2, {
      repoUrl: null,
      code: { repoPath: 'https://github.com/tenon/repo' },
    });
    render(<ArtifactCard artifact={artifact} />);
    expect(
      screen.getAllByRole('link', { name: /https:\/\/github.com\/tenon\/repo/ })
        .length,
    ).toBeGreaterThan(0);
  });

  it('shows no text answer message for code task without content', () => {
    const artifact = buildArtifact(1, 1, {
      contentText: null,
      task: {
        taskId: 1,
        dayIndex: 1,
        type: 'text',
        title: 'Text',
        prompt: null,
      },
    });
    render(<ArtifactCard artifact={artifact} />);
    expect(screen.getByText(/No text answer submitted/)).toBeInTheDocument();
  });
});
