import type { Task } from '../types';

export const DAY3_IMPLEMENTATION_WRAP_UP_TITLE = 'Implementation Wrap-Up';

export const DAY3_IMPLEMENTATION_WRAP_UP_DESCRIPTION =
  'Continue in the same GitHub Codespace and repository you used on Day 2. Today is your final implementation window: finish the core build, improve test coverage, handle edge cases, optimize where useful, and add or improve documentation that makes your work easy to understand. Prepare the implementation for handoff. All coding work must happen inside the Codespace during the open Trial window so the Evidence Trail stays complete.\n\nSame repository as Day 2. Codespace-only. Final implementation day. Your final commit SHA will be captured when you submit or when the window closes.';

export function withDay3ImplementationWrapUpCopy(task: Task): Task {
  if (task.dayIndex !== 3) return task;
  return {
    ...task,
    type: 'code',
    title: DAY3_IMPLEMENTATION_WRAP_UP_TITLE,
    description: DAY3_IMPLEMENTATION_WRAP_UP_DESCRIPTION,
  };
}
