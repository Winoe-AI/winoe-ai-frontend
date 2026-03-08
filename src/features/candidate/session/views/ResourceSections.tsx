import { ResourcePanel } from '../task/components/ResourcePanel';

type Props = {
  showRecording: boolean;
  showDocs: boolean;
  resourceLink: string | null;
};

export function ResourceSections({
  showRecording,
  showDocs,
  resourceLink,
}: Props) {
  return (
    <>
      {showRecording ? (
        <ResourcePanel
          title="Day 4 recording"
          description="Record a short walkthrough covering your decisions."
          linkUrl={resourceLink}
          linkLabel="Open recording link"
          emptyMessage="Look for the recording link in your prompt."
        />
      ) : null}

      {showDocs ? (
        <ResourcePanel
          title="Day 5 reflection"
          description="Use the guided reflection prompt to submit your final notes."
          linkUrl={resourceLink}
          linkLabel="Open reflection prompt"
          emptyMessage="Look for the reflection prompt link in your task description."
        />
      ) : null}
    </>
  );
}
