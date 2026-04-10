'use client';
import { useState } from 'react';
import type { SubmissionArtifact } from '../../types';
import { IntegrityCallout } from '@/shared/ui/IntegrityCallout';
import { ArtifactHeader } from './ArtifactHeader';
import { ArtifactGithubSection } from './ArtifactGithubSection';
import { ArtifactTestResults } from './ArtifactTestResults';
import { ArtifactTextAnswer } from './ArtifactTextAnswer';
import { ArtifactDay4Handoff } from './ArtifactDay4Handoff';
import { isHandoffArtifact } from '../../utils/handoffUtils';
import { deriveArtifactCardState } from './artifactCardState';
import { useArtifactPreviewText } from './useArtifactPreviewText';

type Props = { artifact: SubmissionArtifact; repoLinkLabel?: string | null };

export function ArtifactCard({ artifact, repoLinkLabel }: Props) {
  const isDay4Handoff = isHandoffArtifact(artifact);
  const {
    commitUrl,
    diffSummaryText,
    hasText,
    repoFullName,
    repoUrl,
    showGithub,
    showIntegrity,
    status,
    submittedAt,
    workflowUrl,
  } = deriveArtifactCardState(artifact);

  const [expanded, setExpanded] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const previewText = useArtifactPreviewText(
    artifact.contentText,
    hasText,
    expanded,
  );

  return (
    <div className="rounded border border-gray-200 bg-white p-4">
      <ArtifactHeader
        artifact={artifact}
        status={status}
        submittedAt={submittedAt}
      />

      {showIntegrity ? (
        <IntegrityCallout
          className="mt-3"
          repoUrl={repoUrl}
          cutoffCommitSha={artifact.cutoffCommitSha ?? null}
          cutoffAt={artifact.cutoffAt ?? null}
          isClosed={Boolean(artifact.cutoffCommitSha)}
        />
      ) : null}

      {showGithub && (
        <ArtifactGithubSection
          repoFullName={repoFullName}
          repoUrl={repoUrl}
          repoPath={artifact.code?.repoPath ?? null}
          repoLinkLabel={repoLinkLabel}
          workflowUrl={workflowUrl}
          commitUrl={commitUrl}
          diffUrl={artifact.diffUrl ?? null}
          diffSummaryText={diffSummaryText}
          hasTestResults={Boolean(artifact.testResults)}
        />
      )}

      {artifact.testResults ? (
        <ArtifactTestResults
          testResults={artifact.testResults}
          showOutput={showOutput}
          onToggleOutput={() => setShowOutput((v) => !v)}
        />
      ) : null}

      {isDay4Handoff ? <ArtifactDay4Handoff artifact={artifact} /> : null}

      {artifact.task.prompt ? (
        <ArtifactTextAnswer.Prompt value={artifact.task.prompt} />
      ) : null}

      {hasText ? (
        <ArtifactTextAnswer.Text
          expanded={expanded}
          previewText={previewText}
          content={artifact.contentText as string}
          onToggle={() => setExpanded((v) => !v)}
        />
      ) : !isDay4Handoff ? (
        <ArtifactTextAnswer.Empty
          showGithub={showGithub}
          taskType={artifact.task.type}
        />
      ) : null}
    </div>
  );
}
