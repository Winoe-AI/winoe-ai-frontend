'use client';

import type { ReactNode } from 'react';
import { DraftSaveStatus } from './DraftSaveStatus';
import type { TaskDraftAutosaveStatus } from '../hooks/useTaskDraftAutosave';

type TaskDraftStatusSlotsProps = {
  showDay1DraftStatus: boolean;
  showDay5DraftStatus: boolean;
  draftAutosaveStatus: TaskDraftAutosaveStatus;
  savedAt: number | null;
  draftRestoreApplied: boolean;
  draftError: string | null;
};

export function TaskDraftStatusSlots({
  showDay1DraftStatus,
  showDay5DraftStatus,
  draftAutosaveStatus,
  savedAt,
  draftRestoreApplied,
  draftError,
}: TaskDraftStatusSlotsProps) {
  const statusNode = (
    <DraftSaveStatus
      status={draftAutosaveStatus}
      lastSavedAt={savedAt}
      restoreApplied={draftRestoreApplied}
      error={draftError}
    />
  );

  return {
    headerStatusSlot: showDay1DraftStatus ? (statusNode as ReactNode) : null,
    stickyDraftStatus: showDay5DraftStatus ? (
      <div className="sticky bottom-2 z-20 mt-3 rounded-md border border-gray-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
        {statusNode}
      </div>
    ) : null,
  };
}
