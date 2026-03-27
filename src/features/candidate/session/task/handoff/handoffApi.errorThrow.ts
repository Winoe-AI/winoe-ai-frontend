import { HttpError } from '@/lib/api/errors/errors';

export function copyMappedAndThrow(
  sourceDetails: unknown,
  mapped: HttpError,
  overrides?: { status?: number; message?: string },
): never {
  const next = new HttpError(
    overrides?.status ?? mapped.status,
    overrides?.message ?? mapped.message,
    mapped.headers,
  );
  (next as { redirect?: (() => void) | undefined }).redirect = (
    mapped as { redirect?: (() => void) | undefined }
  ).redirect;
  (next as { raw?: unknown }).raw = (mapped as { raw?: unknown }).raw;
  (next as { meta?: unknown }).meta = (mapped as { meta?: unknown }).meta;
  if (sourceDetails !== undefined) {
    (next as { details?: unknown }).details = sourceDetails;
  }
  throw next;
}
