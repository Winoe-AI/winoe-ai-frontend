import { ResourcePanel } from '@/features/candidate/tasks/components/ResourcePanel';

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
          title="Day 4 demo"
          description="Upload or review your demo presentation for this simulation."
          linkUrl={resourceLink}
          linkLabel="Open demo resource"
          emptyMessage="Use the demo upload panel below to submit your presentation."
        />
      ) : null}

      {showDocs ? (
        <ResourcePanel
          title="Day 5 reflection essay"
          description="Write your final markdown reflection essay in the editor below."
          linkUrl={resourceLink}
          linkLabel="Open reference"
          emptyMessage="Use the markdown editor below to write your reflection essay."
        />
      ) : null}
    </>
  );
}
