import { deriveTestStatus } from '@/shared/formatters';
import type { SubmissionArtifact } from '../../types';
import {
  deriveRepoInfo,
  formatDateTime,
  hasContent,
  shouldShowGithubSection,
} from '../../utils/formatters';
import { formatDiffSummary } from './artifactUtils';

export function deriveArtifactCardState(artifact: SubmissionArtifact) {
  const { repoUrl, repoFullName } = deriveRepoInfo(artifact);
  const workflowUrl = artifact.workflowUrl ?? artifact.testResults?.workflowUrl ?? null;
  const commitUrl = artifact.commitUrl ?? artifact.testResults?.commitUrl ?? null;
  const showIntegrity =
    artifact.task.dayIndex === 2 ||
    artifact.task.dayIndex === 3 ||
    Boolean(artifact.cutoffCommitSha);

  return {
    repoUrl,
    repoFullName,
    workflowUrl,
    commitUrl,
    diffSummaryText: formatDiffSummary(artifact.diffSummary),
    submittedAt: formatDateTime(artifact.submittedAt),
    status: deriveTestStatus(artifact.testResults),
    hasText: hasContent(artifact.contentText),
    showGithub: shouldShowGithubSection(artifact),
    showIntegrity,
  };
}
