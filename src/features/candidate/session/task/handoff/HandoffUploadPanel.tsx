'use client';

import { StatusPill } from '@/shared/ui/StatusPill';
import { AiNoticeCard } from '../../components/AiNoticeCard';
import type { WindowActionGate } from '../../lib/windowState';
import { TaskContainer } from '../components/TaskContainer';
import { TaskDescription } from '../components/TaskDescription';
import { TaskHeader } from '../components/TaskHeader';
import { TaskPanelErrorBanner } from '../components/TaskPanelErrorBanner';
import type { Task } from '../types';
import { HandoffDeleteCard } from './HandoffDeleteCard';
import { HandoffFinalizeCard } from './HandoffFinalizeCard';
import { HandoffPreviewCard } from './HandoffPreviewCard';
import { HandoffTranscriptPanel } from './HandoffTranscriptPanel';
import { HandoffTranscriptProcessing } from './HandoffTranscriptProcessing';
import { HandoffUploadCard } from './HandoffUploadCard';
import { HandoffUploadProgress } from './HandoffUploadProgress';
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
        {controller.windowClosed ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {controller.windowClosedMessage}
          </div>
        ) : null}
        {controller.aiNoticeEnabled ? (
          <AiNoticeCard
            version={controller.aiNoticeVersion}
            summaryUrl={controller.aiNoticeSummaryUrl}
            compact
          />
        ) : null}

        <HandoffUploadCard
          controller={controller}
          candidateSessionId={candidateSessionId}
        />
        <HandoffFinalizeCard controller={controller} />
        <HandoffDeleteCard controller={controller} />
        <HandoffUploadProgress controller={controller} />
        <HandoffPreviewCard controller={controller} />
        <HandoffTranscriptProcessing controller={controller} />
        <HandoffTranscriptPanel controller={controller} />
      </div>
    </TaskContainer>
  );
}
