import { memo, type ReactNode } from 'react';
import { Task } from '../types';

type TaskHeaderProps = {
  task: Task;
  statusSlot?: ReactNode;
};

export const TaskHeader = memo(function TaskHeader({
  task,
  statusSlot,
}: TaskHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-sm text-gray-500">
          Day {task.dayIndex} • {String(task.type)}
        </div>
        <div className="mt-1 text-2xl font-bold">{task.title}</div>
      </div>
      {statusSlot ? <div className="pt-1">{statusSlot}</div> : null}
    </div>
  );
});
