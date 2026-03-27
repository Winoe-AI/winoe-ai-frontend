import { HttpError } from '@/platform/api-client/errors/errors';

export async function uploadFileToSignedUrl(params: {
  uploadUrl: string;
  uploadMethod?: 'PUT' | 'POST';
  file: File;
  signal?: AbortSignal;
  onProgress?: (pct: number) => void;
}): Promise<void> {
  const { uploadUrl, file, signal, onProgress, uploadMethod = 'PUT' } = params;
  if (!uploadUrl || typeof uploadUrl !== 'string') {
    throw new HttpError(400, 'Upload URL is missing.');
  }
  if (!file) throw new HttpError(400, 'Upload file is missing.');
  if (signal?.aborted) throw new HttpError(0, 'Upload was cancelled.');

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const cleanups: Array<() => void> = [];
    const finish = (fn: () => void) => {
      while (cleanups.length > 0) cleanups.pop()?.();
      fn();
    };
    const rejectWithHttpError = (status: number, message: string) =>
      finish(() => reject(new HttpError(status, message)));
    const abortListener = () => xhr.abort();
    if (signal) {
      signal.addEventListener('abort', abortListener, { once: true });
      cleanups.push(() => signal.removeEventListener('abort', abortListener));
    }
    xhr.open(uploadMethod, uploadUrl, true);
    if (file.type) xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (event) => {
      if (
        !onProgress ||
        !event.lengthComputable ||
        !event.total ||
        event.total <= 0
      )
        return;
      onProgress(
        Math.max(
          0,
          Math.min(100, Math.round((event.loaded / event.total) * 100)),
        ),
      );
    };
    xhr.onerror = () =>
      rejectWithHttpError(
        0,
        'Video upload failed. Check your connection and try again.',
      );
    xhr.onabort = () => rejectWithHttpError(0, 'Video upload was cancelled.');
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        finish(() => {
          onProgress?.(100);
          resolve();
        });
        return;
      }
      rejectWithHttpError(
        xhr.status || 0,
        'Video upload failed. Please retry.',
      );
    };
    xhr.send(file);
  });
}
