import Button from '@/shared/ui/Button';

type Props = {
  repoUrl: string | null;
  canCopy: boolean;
  copied: boolean;
  onCopy: () => void;
};

export function CodespaceFallbackRepoCard({
  repoUrl,
  canCopy,
  copied,
  onCopy,
}: Props) {
  return (
    <div className="mt-3 rounded border border-amber-200 bg-white/80 p-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-amber-900">Repo URL</span>
        {canCopy ? (
          <Button size="sm" variant="ghost" onClick={onCopy} disabled={!repoUrl}>
            {copied ? 'Copied' : 'Copy'}
          </Button>
        ) : null}
      </div>
      {repoUrl ? (
        <div className="break-all font-mono text-xs text-gray-700">{repoUrl}</div>
      ) : (
        <div className="text-xs text-amber-900">
          Repo URL is still loading. Try refresh or retry.
        </div>
      )}
    </div>
  );
}
