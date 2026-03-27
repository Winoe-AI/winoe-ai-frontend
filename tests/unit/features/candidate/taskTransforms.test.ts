import {
  deriveCurrentDayIndex,
  normalizeCompletedTaskIds,
  toTask,
} from '@/features/candidate/session/utils/taskTransformsUtils';

describe('taskTransforms', () => {
  it('normalizes completed ids from root or progress', () => {
    expect(
      normalizeCompletedTaskIds({
        isComplete: false,
        completedTaskIds: [1, 2],
        currentTask: null,
      }),
    ).toEqual([1, 2]);

    expect(
      normalizeCompletedTaskIds({
        isComplete: false,
        progress: { completedTaskIds: [3] },
        currentTask: null,
      }),
    ).toEqual([3]);
  });

  it('maps dto task to Task', () => {
    const task = toTask({
      id: 9,
      dayIndex: 3,
      type: 'code',
      title: 'Implement',
      description: 'Build it',
      cutoffCommitSha: 'ff00cc',
      cutoffAt: '2026-03-09T12:34:56.000Z',
    });
    expect(task?.id).toBe(9);
    expect(task?.cutoffCommitSha).toBe('ff00cc');
    expect(task?.cutoffAt).toBe('2026-03-09T12:34:56.000Z');
    expect(toTask(null)).toBeNull();
  });

  it('derives current day index from completion flags', () => {
    expect(deriveCurrentDayIndex(2, null, false)).toBe(3);
    expect(
      deriveCurrentDayIndex(
        0,
        { id: 1, dayIndex: 4, type: 'code', title: '', description: '' },
        false,
      ),
    ).toBe(4);
    expect(deriveCurrentDayIndex(4, null, true)).toBe(5);
  });
});
