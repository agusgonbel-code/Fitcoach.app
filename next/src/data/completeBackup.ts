import { createBackup, restoreBackup, validateBackup, type FitCoachBackupV1 } from './backup';
import {
  loadProgressPhotos,
  removeProgressPhoto,
  saveProgressPhoto,
  validProgressPhotoMeta,
  type ProgressPhotoMeta,
  type ProgressPhotoRecord,
} from './progressPhotoRepository';
import {
  nutritionPlanStorageKey,
  validPersistedNutritionPlan,
  type PersistedNutritionPlan,
} from './nutritionPlanRepository';

export const COMPLETE_BACKUP_VERSION = 1 as const;
const COMPLETE_SCHEMA = 'fitcoach-next-complete-backup' as const;
const MAX_PHOTO_BYTES = 2.5 * 1024 * 1024;
const MAX_TOTAL_PHOTO_BYTES = 60 * 1024 * 1024;

export interface EncodedProgressPhoto extends ProgressPhotoMeta {
  byteLength: number;
  base64: string;
}

export interface FitCoachCompleteBackupV1 {
  schema: typeof COMPLETE_SCHEMA;
  version: typeof COMPLETE_BACKUP_VERSION;
  exportedAt: string;
  core: FitCoachBackupV1;
  nutritionPlan: PersistedNutritionPlan | null;
  progressPhotos: EncodedProgressPhoto[];
}

function parseJson(raw: string | null): unknown {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length)));
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function encodeProgressPhoto(record: ProgressPhotoRecord): Promise<EncodedProgressPhoto> {
  if (!validProgressPhotoMeta(record) || !(record.blob instanceof Blob) || record.blob.size <= 0 || record.blob.size > MAX_PHOTO_BYTES) {
    throw new Error('Hay una fotografía de progreso no válida y no puede exportarse.');
  }
  const bytes = new Uint8Array(await record.blob.arrayBuffer());
  return {
    id: record.id,
    localDate: record.localDate,
    pose: record.pose,
    weightKg: record.weightKg,
    mimeType: record.mimeType,
    width: record.width,
    height: record.height,
    createdAt: record.createdAt,
    byteLength: bytes.byteLength,
    base64: bytesToBase64(bytes),
  };
}

export function decodeProgressPhoto(value: EncodedProgressPhoto): ProgressPhotoRecord {
  const bytes = base64ToBytes(value.base64);
  if (bytes.byteLength !== value.byteLength || bytes.byteLength <= 0 || bytes.byteLength > MAX_PHOTO_BYTES) {
    throw new Error('La copia contiene una fotografía dañada.');
  }
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const blob = new Blob([buffer], { type: value.mimeType });
  const { byteLength: _byteLength, base64: _base64, ...meta } = value;
  return { ...meta, blob };
}

function validEncodedPhoto(value: unknown): value is EncodedProgressPhoto {
  if (!value || typeof value !== 'object') return false;
  const photo = value as Partial<EncodedProgressPhoto>;
  if (!validProgressPhotoMeta(photo as ProgressPhotoMeta)) return false;
  return typeof photo.byteLength === 'number' && Number.isInteger(photo.byteLength) && photo.byteLength > 0 && photo.byteLength <= MAX_PHOTO_BYTES &&
    typeof photo.base64 === 'string' && photo.base64.length > 0;
}

export function validateCompleteBackup(value: unknown): FitCoachCompleteBackupV1 {
  if (!value || typeof value !== 'object') throw new Error('La copia completa no tiene un formato válido.');
  const backup = value as Partial<FitCoachCompleteBackupV1>;
  if (backup.schema !== COMPLETE_SCHEMA || backup.version !== COMPLETE_BACKUP_VERSION || typeof backup.exportedAt !== 'string' || !backup.exportedAt) {
    throw new Error('La copia completa no es compatible con esta versión de FitCoach Next.');
  }
  validateBackup(backup.core);
  if (backup.nutritionPlan !== null && !validPersistedNutritionPlan(backup.nutritionPlan)) {
    throw new Error('La copia contiene un plan nutricional dañado.');
  }
  if (!Array.isArray(backup.progressPhotos) || !backup.progressPhotos.every(validEncodedPhoto)) {
    throw new Error('La copia contiene fotografías dañadas o no válidas.');
  }
  const ids = new Set<string>();
  let totalBytes = 0;
  for (const photo of backup.progressPhotos) {
    if (ids.has(photo.id)) throw new Error('La copia contiene fotografías duplicadas.');
    ids.add(photo.id);
    totalBytes += photo.byteLength;
  }
  if (totalBytes > MAX_TOTAL_PHOTO_BYTES) throw new Error('La copia supera el límite seguro de fotografías.');
  return backup as FitCoachCompleteBackupV1;
}

export async function createCompleteBackup(storage: Storage = localStorage, now = new Date()): Promise<FitCoachCompleteBackupV1> {
  const core = createBackup(storage, now);
  const rawPlan = parseJson(storage.getItem(nutritionPlanStorageKey()));
  if (rawPlan !== null && !validPersistedNutritionPlan(rawPlan)) {
    throw new Error('El plan nutricional guardado no es válido y no puede exportarse.');
  }
  const photos = await loadProgressPhotos();
  const progressPhotos: EncodedProgressPhoto[] = [];
  let totalBytes = 0;
  for (const photo of photos) {
    const encoded = await encodeProgressPhoto(photo);
    totalBytes += encoded.byteLength;
    if (totalBytes > MAX_TOTAL_PHOTO_BYTES) throw new Error('Las fotografías superan el límite seguro de 60 MB para una copia.');
    progressPhotos.push(encoded);
  }
  return {
    schema: COMPLETE_SCHEMA,
    version: COMPLETE_BACKUP_VERSION,
    exportedAt: now.toISOString(),
    core,
    nutritionPlan: rawPlan as PersistedNutritionPlan | null,
    progressPhotos,
  };
}

async function replaceProgressPhotos(records: ProgressPhotoRecord[]): Promise<void> {
  const current = await loadProgressPhotos();
  for (const photo of current) await removeProgressPhoto(photo.id);
  for (const photo of records) await saveProgressPhoto(photo);
}

export async function restoreCompleteBackup(value: unknown, storage: Storage = localStorage): Promise<FitCoachCompleteBackupV1> {
  const backup = validateCompleteBackup(value);
  const nutritionKey = nutritionPlanStorageKey();
  const previousPlan = storage.getItem(nutritionKey);
  const previousPhotos = await loadProgressPhotos();
  const decodedPhotos = backup.progressPhotos.map(decodeProgressPhoto);
  const coreSnapshot = createBackup(storage);

  try {
    restoreBackup(backup.core, storage);
    if (backup.nutritionPlan) storage.setItem(nutritionKey, JSON.stringify(backup.nutritionPlan));
    else storage.removeItem(nutritionKey);
    await replaceProgressPhotos(decodedPhotos);
    return backup;
  } catch (error) {
    try { restoreBackup(coreSnapshot, storage); } catch { /* best effort */ }
    try {
      if (previousPlan === null) storage.removeItem(nutritionKey); else storage.setItem(nutritionKey, previousPlan);
    } catch { /* best effort */ }
    try { await replaceProgressPhotos(previousPhotos); } catch { /* best effort */ }
    throw new Error(`No se pudo restaurar la copia completa. Se ha recuperado el estado anterior. ${error instanceof Error ? error.message : ''}`.trim());
  }
}

export function completeBackupFileName(date = new Date()): string {
  const local = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return `fitcoach-next-complete-v${COMPLETE_BACKUP_VERSION}-${local}.json`;
}
