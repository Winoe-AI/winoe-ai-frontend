import { screen } from '@testing-library/react';
import {
  baseTask,
  primeDraftMocks,
  renderTaskView,
} from './CandidateTaskView.testlib';

describe('CandidateTaskView Day 3 implementation wrap-up', () => {
  beforeEach(() => {
    primeDraftMocks();
  });

  it('reframes stale Day 3 task data as same-repo implementation wrap-up', () => {
    renderTaskView({
      task: {
        ...baseTask,
        id: 3,
        dayIndex: 3,
        type: 'debug',
        title: ['Debugging', 'Exercise'].join(' '),
        description: [
          'Debug the existing',
          'codebase from the',
          ['tem', 'plate.'].join(''),
        ].join(' '),
      },
    });

    expect(screen.getByText('Implementation Wrap-Up')).toBeInTheDocument();
    expect(
      screen.getByText(/same GitHub Codespace and repository/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/same repository as Day 2/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Codespace-only/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/finish the core build/i)).toBeInTheDocument();
    expect(screen.getByText(/improve test coverage/i)).toBeInTheDocument();
    expect(screen.getByText(/handle edge cases/i)).toBeInTheDocument();
    expect(screen.getByText(/optimize where useful/i)).toBeInTheDocument();
    expect(screen.getAllByText(/documentation/i).length).toBeGreaterThan(0);
    expect(
      screen.getByRole('button', { name: /submit implementation wrap-up/i }),
    ).toBeInTheDocument();

    const pageText = document.body.textContent ?? '';
    expect(pageText).not.toMatch(/Day 3 • debug/i);
    expect(pageText).not.toMatch(
      new RegExp(['Debugging', 'Exercise'].join(' '), 'i'),
    );
    expect(pageText).not.toMatch(new RegExp(['tem', 'plate'].join(''), 'i'));
    expect(pageText).not.toMatch(new RegExp(['pre', 'commit'].join(''), 'i'));
    expect(pageText).not.toMatch(
      new RegExp(['existing', 'codebase'].join(' '), 'i'),
    );
    expect(pageText).not.toMatch(
      new RegExp(['offline', 'work'].join(' '), 'i'),
    );
    expect(pageText).not.toMatch(new RegExp(['local', 'work'].join(' '), 'i'));
  });
});
