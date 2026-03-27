import { memo } from 'react';

type TaskDescriptionProps = {
  description: string;
};

export const TaskDescription = memo(function TaskDescription({
  description,
}: TaskDescriptionProps) {
  return (
    <div className="mt-4 whitespace-pre-wrap text-sm text-gray-800">
      {description}
    </div>
  );
});
