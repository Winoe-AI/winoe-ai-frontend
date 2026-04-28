import Button from '@/shared/ui/Button';
import { ACCEPT_INPUT_VALUE } from './panelConstants';
import type { HandoffUploadPanelController } from './handoffUploadPanelTypes';

type Props = {
  controller: HandoffUploadPanelController;
  candidateSessionId: number | null;
};

export function HandoffUploadActionButtons({
  controller,
  candidateSessionId,
}: Props) {
  const {
    hasRecording,
    openFilePicker,
    replaceDisabled,
    clearErrorAndRefresh,
    uploading,
    completingUpload,
    deletingUpload,
    fileInputRef,
    onInputChange,
  } = controller;
  const uploadDisabled = replaceDisabled || !controller.consentChecked;

  return (
    <>
      {!hasRecording ? (
        <div className="mt-3">
          <Button
            variant="primary"
            onClick={openFilePicker}
            disabled={uploadDisabled}
          >
            Upload demo video
          </Button>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={openFilePicker}
            disabled={uploadDisabled}
            aria-label="Replace upload: resubmit demo video"
          >
            Resubmit demo video
          </Button>
          <Button
            variant="ghost"
            onClick={clearErrorAndRefresh}
            disabled={
              uploading ||
              completingUpload ||
              deletingUpload ||
              candidateSessionId === null
            }
          >
            Refresh transcript
          </Button>
        </div>
      )}

      <input
        ref={fileInputRef}
        className="hidden"
        type="file"
        accept={ACCEPT_INPUT_VALUE}
        onChange={onInputChange}
        disabled={uploadDisabled}
      />
    </>
  );
}
