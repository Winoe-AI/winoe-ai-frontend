import Button from '@/shared/ui/Button';

type Props = {
  commandBlock: string;
  canCopy: boolean;
  copied: boolean;
  onCopy: () => void;
};

export function CodespaceFallbackCommandCard({
  commandBlock,
  canCopy,
  copied,
  onCopy,
}: Props) {
  return (
    <div className="mt-3 rounded border border-amber-200 bg-gray-900 p-2 text-xs text-gray-100">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="font-semibold text-gray-100">Suggested commands</span>
        {canCopy ? (
          <Button size="sm" variant="secondary" onClick={onCopy}>
            {copied ? 'Copied' : 'Copy'}
          </Button>
        ) : null}
      </div>
      <pre className="whitespace-pre-wrap break-words font-mono">
        {commandBlock}
      </pre>
    </div>
  );
}
