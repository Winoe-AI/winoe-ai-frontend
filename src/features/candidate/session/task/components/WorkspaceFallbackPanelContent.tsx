import Button from '@/shared/ui/Button';
import { CodespaceFallbackPanel } from './CodespaceFallbackPanel';

type WorkspaceFallbackPanelContentProps = {
  shouldShowActionableFallback: boolean;
  shouldShowUnavailableFallbackState: boolean;
  repoUrl: string | null;
  repoFullName: string | null;
  codespaceFallbackReason: string | null;
  codespaceAvailability: string | null;
  cutoffAt: string | null;
  loading: boolean;
  refreshing: boolean;
  onRetry: () => void;
};

export function WorkspaceFallbackPanelContent({
  shouldShowActionableFallback,
  shouldShowUnavailableFallbackState,
  repoUrl,
  repoFullName,
  codespaceFallbackReason,
  codespaceAvailability,
  cutoffAt,
  loading,
  refreshing,
  onRetry,
}: WorkspaceFallbackPanelContentProps) {
  if (shouldShowActionableFallback) {
    return (
      <CodespaceFallbackPanel
        repoUrl={repoUrl}
        repoFullName={repoFullName}
        errorState={codespaceFallbackReason ?? codespaceAvailability}
        cutoffAt={cutoffAt}
        onRetry={onRetry}
      />
    );
  }

  if (!shouldShowUnavailableFallbackState) return null;

  return (
    <section
      aria-labelledby="codespace-fallback-unavailable-heading"
      className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3
          id="codespace-fallback-unavailable-heading"
          className="text-sm font-semibold"
        >
          Codespaces unavailable, repo details still loading
        </h3>
        <Button
          size="sm"
          variant="secondary"
          onClick={onRetry}
          disabled={loading || refreshing}
        >
          {loading || refreshing ? 'Trying…' : 'Try again'}
        </Button>
      </div>
      <p className="mt-2 text-xs text-amber-900">
        Retry to fetch repository details before showing local clone steps.
      </p>
    </section>
  );
}
