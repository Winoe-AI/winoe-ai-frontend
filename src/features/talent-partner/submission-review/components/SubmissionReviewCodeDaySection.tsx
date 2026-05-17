'use client';

import { useEffect, useMemo } from 'react';
import { Card } from '@/shared/ui/Card';
import type { SubmissionReviewCodeDay as SubmissionReviewCodeDayPayload } from '../../api';
import type { SubmissionReviewCodeFile } from '../../api';
import { SubmissionReviewCodePreview } from './SubmissionReviewCodePreview';
import { SubmissionReviewCommitTimeline } from './SubmissionReviewCommitTimeline';
import { SubmissionReviewFileTree } from './SubmissionReviewFileTree';

type Props = {
  title: string;
  day: SubmissionReviewCodeDayPayload | null;
  selectedFilePath: string | null;
  selectedCommitSha: string | null;
  onSelectFile: (path: string) => void;
  onSelectCommit: (sha: string | null) => void;
};

function collectFilePaths(files: SubmissionReviewCodeFile[]): string[] {
  const paths: string[] = [];
  for (const file of files) {
    if (file.type === 'folder') {
      paths.push(...collectFilePaths(file.children ?? []));
      continue;
    }
    if (file.path) paths.push(file.path);
  }
  return paths;
}

function findFileByPath(
  files: SubmissionReviewCodeFile[],
  targetPath: string | null,
): SubmissionReviewCodeFile | null {
  if (!targetPath) return null;
  for (const file of files) {
    if (file.type === 'folder') {
      const nested = findFileByPath(file.children ?? [], targetPath);
      if (nested) return nested;
      continue;
    }
    if (file.path === targetPath) return file;
  }
  return null;
}

export function SubmissionReviewCodeDaySection({
  title,
  day,
  selectedFilePath,
  selectedCommitSha,
  onSelectFile,
  onSelectCommit,
}: Props) {
  const highlightedFiles = useMemo(
    () =>
      new Set(
        selectedCommitSha
          ? (day?.commits ?? [])
              .filter((commit) => commit.sha === selectedCommitSha)
              .flatMap((commit) => commit.changedFiles ?? [])
          : [],
      ),
    [day?.commits, selectedCommitSha],
  );

  const selectedFile = findFileByPath(
    day?.fileTree ?? [],
    selectedFilePath ?? null,
  );
  const visibleFile = selectedFile ?? null;

  useEffect(() => {
    if (!day?.fileTree?.length) return;
    if (selectedFilePath && selectedFile) return;
    const preferredPath =
      day.selectedFilePath ??
      collectFilePaths(day.fileTree).find(Boolean) ??
      null;
    if (preferredPath) onSelectFile(preferredPath);
  }, [day, onSelectFile, selectedFile, selectedFilePath]);

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-primary">
          {title}
        </h2>
        <div className="flex flex-wrap gap-3 text-sm text-secondary">
          <span>
            Submitted{' '}
            {day?.submittedAt
              ? new Intl.DateTimeFormat('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(day.submittedAt))
              : 'Not submitted yet'}
          </span>
          <span>
            {typeof day?.wordCount === 'number' ? day.wordCount : '—'} words
          </span>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <Card className="max-h-[760px] overflow-auto">
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-secondary">
                  File tree
                </h3>
              </div>
              {(day?.fileTree ?? []).length > 0 ? (
                <SubmissionReviewFileTree
                  files={day?.fileTree ?? []}
                  selectedPath={selectedFilePath}
                  highlightedFiles={highlightedFiles}
                  onSelect={onSelectFile}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-subtle bg-secondary px-4 py-4 text-sm text-secondary">
                  No file tree is available for this day yet.
                </div>
              )}
            </div>
          </Card>

          <Card className="max-h-[360px] overflow-auto">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-secondary">
                Commit timeline
              </h3>
              <SubmissionReviewCommitTimeline
                commits={day?.commits ?? []}
                selectedSha={selectedCommitSha}
                onSelect={onSelectCommit}
              />
              {selectedCommitSha ? (
                <div className="rounded-2xl border border-subtle bg-secondary p-3 text-xs text-secondary">
                  <p className="font-mono uppercase tracking-[0.18em]">
                    Selected commit
                  </p>
                  <p className="mt-1 text-sm text-primary">
                    {(day?.commits ?? []).find(
                      (commit) => commit.sha === selectedCommitSha,
                    )?.message ?? 'Commit unavailable'}
                  </p>
                  <p className="mt-1 font-mono">
                    {(day?.commits ?? []).find(
                      (commit) => commit.sha === selectedCommitSha,
                    )?.changedFiles?.length ?? 0}{' '}
                    changed files
                  </p>
                </div>
              ) : null}
            </div>
          </Card>
        </aside>

        <div className="space-y-4">
          <SubmissionReviewCodePreview file={visibleFile} />
        </div>
      </div>
    </section>
  );
}
