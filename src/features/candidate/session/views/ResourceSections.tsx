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
          description="Upload or review your Handoff + Demo for this Trial."
          linkUrl={resourceLink}
          linkLabel="Open demo resource"
          emptyMessage="Use the demo upload panel below to submit your demo video."
        />
      ) : null}

      {showDocs ? (
        <ResourcePanel
          title="Day 5 reflection essay"
          description="Use the final markdown editor below to reflect on your full Trial experience."
          linkUrl={resourceLink}
          linkLabel="Open reference"
          emptyMessage="Day 5 is open from 9:00 AM–9:00 PM your local time. Use the markdown editor below to write your reflection essay."
        />
      ) : null}
    </>
  );
}
