type FitProfileWarningBannerProps = {
  warnings: string[];
};

export function FitProfileWarningBanner({
  warnings,
}: FitProfileWarningBannerProps) {
  if (warnings.length === 0) return null;

  return (
    <div className="fit-profile-avoid-break rounded border border-amber-200 bg-amber-50 p-3">
      <p className="text-sm font-semibold text-amber-900">Report warnings</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </div>
  );
}
