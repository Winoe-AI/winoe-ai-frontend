type Props = {
  repoUrl: string | null;
  codespaceUrl: string | null;
};

export function IntegrityCalloutLinks({ repoUrl, codespaceUrl }: Props) {
  if (!repoUrl && !codespaceUrl) return null;

  return (
    <div className="mt-2 space-y-1">
      {repoUrl ? (
        <p className="break-all">
          <span className="font-semibold">Repository:</span>{' '}
          <a
            className="text-blue-700 underline hover:text-blue-800"
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {repoUrl}
          </a>
        </p>
      ) : null}
      {codespaceUrl ? (
        <p className="break-all">
          <span className="font-semibold">Codespace:</span>{' '}
          <a
            className="text-blue-700 underline hover:text-blue-800"
            href={codespaceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {codespaceUrl}
          </a>
        </p>
      ) : null}
    </div>
  );
}
