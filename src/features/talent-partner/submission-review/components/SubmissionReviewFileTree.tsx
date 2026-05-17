'use client';

import type { SubmissionReviewCodeFile } from '../../api';

type Props = {
  files: SubmissionReviewCodeFile[];
  selectedPath: string | null;
  highlightedFiles: Set<string>;
  onSelect: (path: string) => void;
};

function FileIcon({ file }: { file: SubmissionReviewCodeFile }) {
  const label =
    file.type === 'folder'
      ? 'DIR'
      : (file.language?.toUpperCase().slice(0, 4) ??
        file.name.split('.').pop()?.toUpperCase()?.slice(0, 4) ??
        'FILE');
  return (
    <span className="inline-flex min-w-10 items-center justify-center rounded-full border border-subtle bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">
      {label}
    </span>
  );
}

function FileTreeNode({
  file,
  level,
  selectedPath,
  highlightedFiles,
  onSelect,
}: {
  file: SubmissionReviewCodeFile;
  level: number;
  selectedPath: string | null;
  highlightedFiles: Set<string>;
  onSelect: (path: string) => void;
}) {
  const isSelected = selectedPath === file.path;
  const isHighlighted = highlightedFiles.has(file.path);
  const indent = level * 14;

  if (file.type === 'folder') {
    return (
      <li>
        <div
          className="flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium text-primary"
          style={{ paddingLeft: indent }}
        >
          <span className="text-secondary">▸</span>
          <span>{file.name}</span>
        </div>
        <ul className="space-y-1">
          {(file.children ?? []).map((child) => (
            <FileTreeNode
              key={child.path || child.name}
              file={child}
              level={level + 1}
              selectedPath={selectedPath}
              highlightedFiles={highlightedFiles}
              onSelect={onSelect}
            />
          ))}
        </ul>
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(file.path)}
        className={[
          'flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm transition',
          isSelected
            ? 'bg-wheat-50 text-wheat-900 ring-1 ring-wheat-200'
            : isHighlighted
              ? 'bg-amber-50 text-primary'
              : 'text-secondary hover:bg-secondary hover:text-primary',
        ].join(' ')}
        style={{ paddingLeft: indent }}
      >
        <FileIcon file={file} />
        <span className="min-w-0 flex-1 truncate">{file.name}</span>
        {isHighlighted ? (
          <span className="rounded-full border border-wheat-200 bg-wheat-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-wheat-900">
            Changed
          </span>
        ) : null}
      </button>
    </li>
  );
}

export function SubmissionReviewFileTree({
  files,
  selectedPath,
  highlightedFiles,
  onSelect,
}: Props) {
  return (
    <ul className="space-y-1">
      {files.map((file) => (
        <FileTreeNode
          key={file.path || file.name}
          file={file}
          level={0}
          selectedPath={selectedPath}
          highlightedFiles={highlightedFiles}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}
