import {
  toIdString,
  toNumberOrNull,
  toStringOrNull,
} from '@/features/candidate/session/api/baseApi';
import { asRecord, toIsoOrNull } from './handoffApi.normalize.shared';
import type { HandoffSupplementalMaterial } from './handoffApi.types';

function normalizeSupplementalMaterial(
  raw: unknown,
): HandoffSupplementalMaterial | null {
  const record = asRecord(raw);
  if (!record) return null;
  const filename = toStringOrNull(
    record.filename ?? record.fileName ?? record.name,
  );
  if (!filename) return null;
  return {
    id: toIdString(record.id),
    filename,
    downloadUrl:
      toStringOrNull(record.downloadUrl ?? record.download_url ?? record.url) ??
      null,
    contentType:
      toStringOrNull(
        record.contentType ?? record.content_type ?? record.mimeType,
      ) ?? null,
    sizeBytes:
      toNumberOrNull(record.sizeBytes ?? record.size_bytes ?? record.size) ??
      null,
    uploadedAt:
      toIsoOrNull(
        record.uploadedAt ?? record.uploaded_at ?? record.createdAt,
      ) ?? null,
  };
}

export function normalizeSupplementalMaterials(
  value: unknown,
): HandoffSupplementalMaterial[] | null {
  if (!Array.isArray(value)) return null;
  return value
    .map(normalizeSupplementalMaterial)
    .filter((material): material is HandoffSupplementalMaterial =>
      Boolean(material),
    );
}
