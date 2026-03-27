import Button from '@/shared/ui/Button';
import { ACCEPT_INPUT_VALUE } from './panelConstants';
import type { HandoffUploadPanelController } from './handoffUploadPanelTypes';

type Props = {
  controller: HandoffUploadPanelController;
  candidateSessionId: number | null;
};

export function HandoffUploadActionButtons({ controller, candidateSessionId }: Props) {
  return (
    <>
      {!controller.hasRecording ? (
        <div className="mt-3">
          <Button
            variant="primary"
            onClick={controller.openFilePicker}
            disabled={controller.replaceDisabled}
          >
            Upload video
          </Button>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={controller.openFilePicker}
            disabled={controller.replaceDisabled}
          >
            Replace upload
          </Button>
          <Button
            variant="ghost"
            onClick={controller.clearErrorAndRefresh}
            disabled={
              controller.uploading ||
              controller.completingUpload ||
              controller.deletingUpload ||
              candidateSessionId === null
            }
          >
            Refresh transcript
          </Button>
        </div>
      )}

      <input
        ref={controller.fileInputRef}
        className="hidden"
        type="file"
        accept={ACCEPT_INPUT_VALUE}
        onChange={controller.onInputChange}
        disabled={controller.replaceDisabled}
      />
    </>
  );
}
