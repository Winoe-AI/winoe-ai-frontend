import {
  areWorkspaceStatusesEqual,
  getCodingWorkspace,
} from '@/features/candidate/session/task/utils/codingWorkspace';

describe('codingWorkspace normalization', () => {
  it('uses whichever coding day has workspace data', () => {
    const result = getCodingWorkspace({
      day2Workspace: {
        repoFullName: 'acme/unified',
        repoName: 'acme/unified',
        repoUrl: 'https://github.com/acme/unified',
        codespaceUrl: 'https://codespaces.new/acme/unified',
      },
      day3Workspace: null,
    });

    expect(result.error).toBeNull();
    expect(result.isInitialized).toBe(true);
    expect(result.repoFullName).toBe('acme/unified');
    expect(result.codespaceUrl).toBe('https://codespaces.new/acme/unified');
  });

  it('merges compatible Day 2 and Day 3 records without conflict', () => {
    const result = getCodingWorkspace({
      day2Workspace: {
        repoFullName: 'acme/unified',
        repoName: 'acme/unified',
        repoUrl: 'https://github.com/acme/unified',
        codespaceUrl: null,
      },
      day3Workspace: {
        repoFullName: 'acme/unified',
        repoName: 'acme/unified',
        repoUrl: 'https://github.com/acme/unified',
        codespaceUrl: 'https://codespaces.new/acme/unified?quickstart=1',
      },
    });

    expect(result.error).toBeNull();
    expect(result.isInitialized).toBe(true);
    expect(result.repoUrl).toBe('https://github.com/acme/unified');
    expect(result.codespaceUrl).toBe(
      'https://codespaces.new/acme/unified?quickstart=1',
    );
  });

  it('fails closed when Day 2 and Day 3 repo identities conflict', () => {
    const result = getCodingWorkspace({
      day2Workspace: {
        repoFullName: 'acme/day2',
        repoName: 'acme/day2',
        repoUrl: 'https://github.com/acme/day2',
        codespaceUrl: 'https://codespaces.new/acme/day2',
      },
      day3Workspace: {
        repoFullName: 'acme/day3',
        repoName: 'acme/day3',
        repoUrl: 'https://github.com/acme/day3',
        codespaceUrl: 'https://codespaces.new/acme/day3',
      },
    });

    expect(result.isInitialized).toBe(false);
    expect(result.repoUrl).toBeNull();
    expect(result.codespaceUrl).toBeNull();
    expect(result.error).toMatch(/mismatch/i);
  });

  it('fails closed when codespace identities conflict', () => {
    const result = getCodingWorkspace({
      day2Workspace: {
        repoFullName: 'acme/unified',
        repoName: 'acme/unified',
        repoUrl: 'https://github.com/acme/unified',
        codespaceUrl: 'https://codespaces.new/acme/unified',
      },
      day3Workspace: {
        repoFullName: 'acme/unified',
        repoName: 'acme/unified',
        repoUrl: 'https://github.com/acme/unified',
        codespaceUrl: 'https://codespaces.new/acme/another',
      },
    });

    expect(result.isInitialized).toBe(false);
    expect(result.error).toMatch(/mismatch/i);
  });

  it('compares workspace status snapshots consistently', () => {
    expect(
      areWorkspaceStatusesEqual(
        {
          repoFullName: 'acme/unified',
          repoName: 'acme/unified',
          repoUrl: 'https://github.com/acme/unified',
          codespaceUrl: 'https://codespaces.new/acme/unified',
        },
        {
          repoFullName: 'acme/unified',
          repoName: 'acme/unified',
          repoUrl: 'https://github.com/acme/unified',
          codespaceUrl: 'https://codespaces.new/acme/unified',
        },
      ),
    ).toBe(true);

    expect(
      areWorkspaceStatusesEqual(
        {
          repoFullName: 'acme/unified',
          repoName: 'acme/unified',
          repoUrl: 'https://github.com/acme/unified',
          codespaceUrl: null,
        },
        {
          repoFullName: 'acme/unified',
          repoName: 'acme/unified',
          repoUrl: 'https://github.com/acme/unified',
          codespaceUrl: 'https://codespaces.new/acme/unified',
        },
      ),
    ).toBe(false);
  });
});
