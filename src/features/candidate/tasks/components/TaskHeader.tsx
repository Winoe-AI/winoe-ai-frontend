import { memo, type ReactNode } from 'react';
import { Task } from '../types';

const TASK_DAY_TITLES: Record<number, string> = {
  1: 'Planning & Design Doc',
  2: 'Implementation Kickoff',
  3: 'Implementation Wrap-Up',
  4: 'Handoff + Demo',
  5: 'Reflection Essay',
};

type TaskHeaderProps = {
  task: Task;
  statusSlot?: ReactNode;
};

export const TaskHeader = memo(function TaskHeader({
  task,
  statusSlot,
}: TaskHeaderProps) {
  const dayLabel = TASK_DAY_TITLES[task.dayIndex] ?? task.title;
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-sm text-gray-500">
          Day {task.dayIndex} • {dayLabel}
        </div>
        <div className="mt-1 text-2xl font-bold">{task.title}</div>
      </div>
      {statusSlot ? <div className="pt-1">{statusSlot}</div> : null}
    </div>
  );
});
