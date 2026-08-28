export type ProgressPose = 'front' | 'side' | 'back';

export interface ProgressPhotoMeta {
  id: string;
  localDate: string;
  pose: ProgressPose;
  weightKg?: number;
  mimeType: string;
  width: number;
  height: number;
  createdAt: string;
}

export interface ProgressPhotoRecord extends ProgressPhotoMeta {
  blob: Blob;
}

interface StoredProgressPhotoRecord extends ProgressPhotoMeta {
  bytes: ArrayBuffer;
}

interface FileLike { size: number; type: string; }

const DB_NAME = 'fitcoach-next-media';
const DB_VERSION = 1;
const STORE = 'progress-photos';
const MAX_INPUT_BYTES = 25 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 2.5 * 1024 * 1024;
const MAX_EDGE = 1800;
const ACCEPTED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
const ORIGINAL_SAFE = new Set(['image/jpeg', 'image/png', 'image/webp']);

function isCivilDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isIsoTimestamp(value: string): boolean {
  if (typeof value !== 'string' || !value.trim()) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && /^\d{4}-\d{2}-\d{2}T/.test(value);
}

export function validProgressPhotoMeta(meta: ProgressPhotoMeta): boolean {
  if (!meta || typeof meta !== 'object') return false;
  const validId = typeof meta.id === 'string' && Boolean(meta.id.trim());
  const validDate = typeof meta.localDate === 'string' && isCivilDate(meta.localDate);
  const validPose = meta.pose === 'front' || meta.pose === 'side' || meta.pose === 'back';
  const validWeight = meta.weightKg === undefined || (Number.isFinite(meta.weightKg) && meta.weightKg >= 30 && meta.weightKg <= 350);
  const validMime = typeof meta.mimeType === 'string' && ACCEPTED.has(meta.mimeType.toLowerCase());
  const validDimensions = Number.isFinite(meta.width) && Number.isFinite(meta.height) && meta.width > 0 && meta.height > 0 && meta.width <= MAX_EDGE && meta.height <= MAX_EDGE;
  const validCreatedAt = typeof meta.createdAt === 'string' && isIsoTimestamp(meta.createdAt);
  return validId && validDate && validPose && validCreatedAt && validMime && validDimensions && validWeight;
}

export function isProgressPhotoBlob(value: unknown): value is Blob {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { size?: unknown; type?: unknown; slice?: unknown; arrayBuffer?: unknown };
  return Number.isFinite(candidate.size) && Number(candidate.size) > 0 && Number(candidate.size) <= MAX_OUTPUT_BYTES &&
    typeof candidate.type === 'string' && ACCEPTED.has(candidate.type.toLowerCase()) &&
    typeof candidate.slice === 'function' &&
    typeof candidate.arrayBuffer === 'function';
}

function isArrayBufferLike(value: unknown): value is ArrayBuffer {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { byteLength?: unknown; slice?: unknown };
  return Number.isFinite(candidate.byteLength) && Number(candidate.byteLength) > 0 && Number(candidate.byteLength) <= MAX_OUTPUT_BYTES && typeof candidate.slice === 'function';
}

export function validateProgressPhotoFile(file: FileLike): void {
  if (!file || !Number.isFinite(file.size) || file.size <= 0) throw new Error('Selecciona una fotografía válida.');
  if (file.size > MAX_INPUT_BYTES) throw new Error('La fotografía supera el límite de 25 MB.');
  if (typeof file.type !== 'string' || !ACCEPTED.has(file.type.toLowerCase())) throw new Error('Formato no compatible. Usa JPG, PNG, WebP, HEIC o HEIF.');
}

export function shouldKeepOriginalProgressPhoto(file: FileLike, width: number, height: number): boolean {
  return ORIGINAL_SAFE.has(file.type.toLowerCase()) && file.size <= MAX_OUTPUT_BYTES &&
    Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0 &&
    Math.max(width, height) <= MAX_EDGE;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('localDate', 'localDate');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('No se pudo abrir el almacenamiento privado de fotos.'));
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('No se pudo comprimir la fotografía.')), type, quality));
}

async function decodeWithHtmlImage(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close?: () => void }> {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = 'async';
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('El dispositivo no puede decodificar esta fotografía.'));
      image.src = url;
    });
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('La fotografía no contiene dimensiones válidas.');
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

async function decodeImage(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close?: () => void }> {
  try {
    return await decodeWithHtmlImage(file);
  } catch (htmlError) {
    if (typeof createImageBitmap === 'function') {
      try {
        const bitmap = await createImageBitmap(file);
        if (!bitmap.width || !bitmap.height) { bitmap.close(); throw htmlError; }
        return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
      } catch { /* Preserve the clearer HTML decoder error below. */ }
    }
    throw htmlError;
  }
}

export async function prepareProgressPhoto(file: File): Promise<{ blob: Blob; mimeType: string; width: number; height: number }> {
  validateProgressPhotoFile(file);
  const decoded = await decodeImage(file);
  try {
    if (shouldKeepOriginalProgressPhoto(file, decoded.width, decoded.height)) {
      const bytes = await file.arrayBuffer();
      const blob = new Blob([bytes], { type: file.type.toLowerCase() });
      return { blob, mimeType: file.type.toLowerCase(), width: decoded.width, height: decoded.height };
    }

    const scale = Math.min(1, MAX_EDGE / Math.max(decoded.width, decoded.height));
    const width = Math.max(1, Math.round(decoded.width * scale));
    const height = Math.max(1, Math.round(decoded.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('No se pudo preparar la fotografía.');
    context.drawImage(decoded.source, 0, 0, width, height);
    let quality = 0.86;
    let blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    while (blob.size > MAX_OUTPUT_BYTES && quality > 0.48) {
      quality -= 0.08;
      blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    }
    if (blob.size > MAX_OUTPUT_BYTES) throw new Error('La fotografía sigue siendo demasiado grande después de comprimirla.');
    return { blob, mimeType: 'image/jpeg', width, height };
  } finally { decoded.close?.(); }
}

export async function saveProgressPhoto(record: ProgressPhotoRecord): Promise<void> {
  if (!validProgressPhotoMeta(record) || !isProgressPhotoBlob(record.blob) || record.blob.size > MAX_OUTPUT_BYTES || record.blob.type.toLowerCase() !== record.mimeType.toLowerCase()) {
    throw new Error('La fotografía preparada no es válida.');
  }

  // Store raw bytes instead of Blob/File objects. WebKit/WKWebView has had
  // structured-clone edge cases for Blob subclasses inside IndexedDB
  // transactions. ArrayBuffer is consistently cloneable and we reconstruct the
  // Blob at the repository boundary, so callers keep the same typed API.
  const bytes = await record.blob.arrayBuffer();
  if (!bytes.byteLength || bytes.byteLength > MAX_OUTPUT_BYTES) throw new Error('La fotografía preparada no es válida.');
  const stored: StoredProgressPhotoRecord = {
    id: record.id,
    localDate: record.localDate,
    pose: record.pose,
    weightKg: record.weightKg,
    mimeType: record.mimeType.toLowerCase(),
    width: record.width,
    height: record.height,
    createdAt: record.createdAt,
    bytes,
  };

  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      try {
        tx.objectStore(STORE).put(stored);
      } catch (error) {
        reject(error instanceof Error ? error : new Error('No se pudo guardar la fotografía.'));
        return;
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('No se pudo guardar la fotografía.'));
      tx.onabort = () => reject(tx.error ?? new Error('No se pudo guardar la fotografía.'));
    });
  } finally {
    db.close();
  }
}

export async function loadProgressPhotos(): Promise<ProgressPhotoRecord[]> {
  const db = await openDb();
  try {
    const rows = await new Promise<Array<StoredProgressPhotoRecord | ProgressPhotoRecord>>((resolve, reject) => {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
      request.onsuccess = () => resolve(request.result as Array<StoredProgressPhotoRecord | ProgressPhotoRecord>);
      request.onerror = () => reject(request.error ?? new Error('No se pudieron cargar las fotografías.'));
    });

    // Backward-compatible read: accept the short-lived Blob schema already used
    // by development builds, while all new writes use the byte schema above.
    const result = rows.flatMap(item => {
      if (!validProgressPhotoMeta(item)) return [];
      if ('bytes' in item && isArrayBufferLike(item.bytes)) {
        const blob = new Blob([item.bytes], { type: item.mimeType.toLowerCase() });
        return [{
          id: item.id,
          localDate: item.localDate,
          pose: item.pose,
          weightKg: item.weightKg,
          mimeType: item.mimeType.toLowerCase(),
          width: item.width,
          height: item.height,
          createdAt: item.createdAt,
          blob,
        } satisfies ProgressPhotoRecord];
      }
      if ('blob' in item && isProgressPhotoBlob(item.blob) && item.blob.type.toLowerCase() === item.mimeType.toLowerCase()) return [item];
      return [];
    });
    return result.sort((a, b) => a.localDate.localeCompare(b.localDate) || a.createdAt.localeCompare(b.createdAt));
  } finally {
    db.close();
  }
}

export async function removeProgressPhoto(id: string): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('No se pudo eliminar la fotografía.'));
    });
  } finally {
    db.close();
  }
}
