import type { ChangeEvent, MutableRefObject } from 'react';
import Button from '@/shared/ui/Button';
import { formatBytes } from './panelUtils';
import type { HandoffSupplementalMaterial } from './handoffApi';

type Props = {
  files: File[];
  existingMaterials: HandoffSupplementalMaterial[];
  inputRef: MutableRefObject<HTMLInputElement | null>;
  disabled: boolean;
  onOpenFilePicker: () => void;
  onInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearFiles: () => void;
};

const ACCEPTED_SUPPLEMENTAL_TYPES = [
  '.pdf',
  '.ppt',
  '.pptx',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.txt',
  '.md',
].join(',');

export function HandoffSupplementalMaterials({
  files,
  existingMaterials,
  inputRef,
  disabled,
  onOpenFilePicker,
  onInputChange,
  onClearFiles,
}: Props) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-4">
      <div className="text-sm font-semibold text-gray-900">
        Supplemental materials
      </div>
      <p className="mt-1 text-xs text-gray-600">
        Optional. Add slides, diagrams, screenshots, architecture visuals, or
        notes that help explain your Handoff + Demo.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          onClick={onOpenFilePicker}
          disabled={disabled}
        >
          Attach files
        </Button>
        {files.length ? (
          <Button variant="ghost" onClick={onClearFiles} disabled={disabled}>
            Clear
          </Button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        className="hidden"
        type="file"
        multiple
        accept={ACCEPTED_SUPPLEMENTAL_TYPES}
        onChange={onInputChange}
        disabled={disabled}
      />
      {files.length ? (
        <ul className="mt-3 space-y-2">
          {files.map((file) => (
            <li
              key={`${file.name}-${String(file.size)}-${String(file.lastModified)}`}
              className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800"
            >
              <span className="font-medium">{file.name}</span>{' '}
              <span className="text-gray-500">({formatBytes(file.size)})</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-gray-500">
          No supplemental materials selected. You can submit the demo video
          without them.
        </p>
      )}
      {files.length ? (
        <p className="mt-3 text-xs text-gray-600">
          Selected materials upload when you finalize the Handoff + Demo.
        </p>
      ) : null}
      {existingMaterials.length ? (
        <div className="mt-4">
          <div className="text-xs font-semibold uppercase text-gray-500">
            Latest saved materials
          </div>
          <ul className="mt-2 space-y-2">
            {existingMaterials.map((material) => (
              <li
                key={material.id ?? material.filename}
                className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800"
              >
                {material.downloadUrl ? (
                  <a
                    className="font-medium text-blue-700 underline"
                    href={material.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {material.filename}
                  </a>
                ) : (
                  <span className="font-medium">{material.filename}</span>
                )}{' '}
                {material.sizeBytes !== null ? (
                  <span className="text-gray-500">
                    ({formatBytes(material.sizeBytes)})
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
