export function StartHowCode() {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">
        How code tasks work
      </h2>
      <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-gray-700">
        <li>
          Winoe provisions an empty GitHub Codespace for Day 2. Your GitHub
          username is collected before the day opens.
        </li>
        <li>
          Open the Codespace from the workspace card. That is your editor and
          terminal for implementation work.
        </li>
        <li>
          Run tests from Winoe. We trigger GitHub Actions and show results back
          in this panel.
        </li>
        <li>
          Commit and submit from Winoe. We capture your latest commit SHA with
          your submission.
        </li>
      </ol>
    </div>
  );
}
