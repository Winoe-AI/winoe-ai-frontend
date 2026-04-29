import type { Task } from '../types';
import {
  DAY5_REFLECTION_DAY_INDEX,
  DAY5_REFLECTION_TASK_TYPE,
} from './day5Reflection.constantsUtils';

export function isDay5ReflectionTask(task: Task): boolean {
  const type = String(task.type ?? '')
    .trim()
    .toLowerCase();
  if (type !== DAY5_REFLECTION_TASK_TYPE && type !== 'reflection') return false;
  return task.dayIndex === DAY5_REFLECTION_DAY_INDEX;
}
