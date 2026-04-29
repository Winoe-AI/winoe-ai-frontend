import type { Task } from '../types';
import {
  DAY5_REFLECTION_COMPLETION_DETAIL,
  DAY5_REFLECTION_OPENING_COPY,
  DAY5_REFLECTION_WINDOW_COPY,
} from './day5Reflection.copyUtils';

export const DAY5_REFLECTION_TITLE = 'Reflection Essay';

export const DAY5_REFLECTION_DESCRIPTION = [
  DAY5_REFLECTION_OPENING_COPY,
  `Day 5 is open from ${DAY5_REFLECTION_WINDOW_COPY}.`,
  DAY5_REFLECTION_COMPLETION_DETAIL,
].join('\n\n');

export function withDay5ReflectionCopy(task: Task): Task {
  if (task.dayIndex !== 5) return task;
  return {
    ...task,
    title: DAY5_REFLECTION_TITLE,
    description: DAY5_REFLECTION_DESCRIPTION,
  };
}
