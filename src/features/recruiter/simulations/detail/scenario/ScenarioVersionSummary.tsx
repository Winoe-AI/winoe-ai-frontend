'use client';

import type { ScenarioVersionItem } from './types';

type Props = {
  selected: ScenarioVersionItem | null;
  previous: ScenarioVersionItem | null;
};

function stableString(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function ScenarioVersionSummary({ selected, previous }: Props) {
  if (!selected || !previous) return null;
  if (selected.id === previous.id) return null;
  if (
    selected.contentAvailability !== 'canonical' ||
    previous.contentAvailability !== 'canonical'
  ) {
    return null;
  }

  const changes: string[] = [];
  if ((selected.storylineMd ?? '') !== (previous.storylineMd ?? '')) {
    changes.push('storyline changed');
  }
  if (
    stableString(selected.taskPrompts) !== stableString(previous.taskPrompts)
  ) {
    changes.push('tasks changed');
  }
  if (stableString(selected.rubric) !== stableString(previous.rubric)) {
    changes.push('rubric changed');
  }

  if (!changes.length) {
    return (
      <div className="rounded border border-gray-200 bg-gray-50 p-2 text-xs text-gray-600">
        No content changes detected from previous version.
      </div>
    );
  }

  return (
    <div className="rounded border border-gray-200 bg-gray-50 p-2 text-xs text-gray-600">
      {changes.join(' · ')}
    </div>
  );
}
