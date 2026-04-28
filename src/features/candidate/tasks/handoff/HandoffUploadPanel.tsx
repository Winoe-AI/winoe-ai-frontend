'use client';

import { StatusPill } from '@/shared/ui/StatusPill';
import { AiNoticeCard } from '@/features/candidate/session/components/AiNoticeCard';
import type { WindowActionGate } from '@/features/candidate/session/lib/windowState';
import { TaskContainer } from '../components/TaskContainer';
import { TaskDescription } from '../components/TaskDescription';
import { TaskHeader } from '../components/TaskHeader';
import { TaskPanelErrorBanner } from '../components/TaskPanelErrorBanner';
import type { Task } from '../types';
import { HandoffDeleteCard } from './HandoffDeleteCard';
import { HandoffFinalizeCard } from './HandoffFinalizeCard';
import { HandoffPreviewCard } from './HandoffPreviewCard';
import { HandoffSupplementalMaterials } from './HandoffSupplementalMaterials';
import { HandoffTranscriptFailure } from './HandoffTranscriptFailure';
import { HandoffTranscriptPanel } from './HandoffTranscriptPanel';
import { HandoffTranscriptProcessing } from './HandoffTranscriptProcessing';
import { HandoffUploadCard } from './HandoffUploadCard';
import { HandoffUploadProgress } from './HandoffUploadProgress';
import { HandoffWindowStatus } from './HandoffWindowStatus';
import { useHandoffUploadController } from './useHandoffUploadController';

type Props = {
  candidateSessionId: number | null;
  task: Task;
  actionGate: WindowActionGate;
  onTaskWindowClosed?: (err: unknown) => void;
};

export function HandoffUploadPanel({
  candidateSessionId,
  task,
  actionGate,
  onTaskWindowClosed,
}: Props) {
  const controller = useHandoffUploadController({
    candidateSessionId,
    task,
    actionGate,
    onTaskWindowClosed,
  });

  return (
    <TaskContainer>
      <TaskHeader
        task={task}
        statusSlot={
          <StatusPill
            label={controller.statusPill.label}
            tone={controller.statusPill.tone}
          />
        }
      />
      <TaskDescription description={task.description} />

      <div className="mt-6 space-y-4">
        <TaskPanelErrorBanner message={controller.combinedError} />
        <HandoffWindowStatus task={task} controller={controller} />
        {controller.aiNoticeEnabled ? (
          <AiNoticeCard
            version={controller.aiNoticeVersion}
            noticeText={controller.aiNoticeText}
            summaryUrl={controller.aiNoticeSummaryUrl}
            compact
          />
        ) : null}

        <HandoffUploadCard
          controller={controller}
          candidateSessionId={candidateSessionId}
        />
        <HandoffSupplementalMaterials
          files={controller.supplementalFiles}
          existingMaterials={controller.state.supplementalMaterials ?? []}
          inputRef={controller.supplementalInputRef}
          disabled={controller.replaceDisabled}
          onOpenFilePicker={controller.openSupplementalFilePicker}
          onInputChange={controller.onSupplementalInputChange}
          onClearFiles={() => controller.setSupplementalFiles([])}
        />
        <HandoffFinalizeCard controller={controller} />
        <HandoffDeleteCard controller={controller} />
        <HandoffUploadProgress controller={controller} />
        <HandoffPreviewCard controller={controller} />
        <HandoffTranscriptProcessing controller={controller} />
        <HandoffTranscriptFailure controller={controller} />
        <HandoffTranscriptPanel controller={controller} />
      </div>
    </TaskContainer>
  );
}
