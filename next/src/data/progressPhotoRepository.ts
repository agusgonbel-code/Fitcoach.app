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

interface FileLike { size: number; type: string; }

const DB_NAME = 'fitcoach-next-media';
const DB_VERSION = 1;
const STORE = 'progress-photos';
const MAX_INPUT_BYTES = 25 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 2.5 * 1024 * 1024;
const MAX_EDGE = 1800;
const ACCEPTED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

export function validProgressPhotoMeta(meta: ProgressPhotoMeta): boolean {
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(meta.localDate);
  const validPose = meta.pose === 'front' || meta.pose === 'side' || meta.pose === 'back';
  const validWeight = meta.weightKg === undefined || (Number.isFinite(meta.weightKg) && meta.weightKg >= 30 && meta.weightKg <= 350);
  return Boolean(meta.id && validDate && validPose && meta.createdAt && ACCEPTED.has(meta.mimeType) && meta.width > 0 && meta.height > 0 && validWeight);
}

export function isProgressPhotoBlob(value: unknown): value is Blob {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { size?: unknown; type?: unknown; slice?: unknown; arrayBuffer?: unknown };
  return Number.isFinite(candidate.size) && Number(candidate.size) > 0 &&
    typeof candidate.type === 'string' &&
    typeof candidate.slice === 'function' &&
    typeof candidate.arrayBuffer === 'function';
}

export function validateProgressPhotoFile(file: FileLike): void {
  if (!file || !Number.isFinite(file.size) || file.size <= 0) throw new Error('Selecciona una fotografía válida.');
  if (file.size > MAX_INPUT_BYTES) throw new Error('La fotografía supera el límite de 25 MB.');
  if (!ACCEPTED.has(file.type.toLowerCase())) throw new Error('Formato no compatible. Usa JPG, PNG, WebP, HEIC o HEIF.');
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

async function decodeImage(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close?: () => void }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch { /* Safari may decode HEIC through HTMLImageElement instead. */ }
  }

  const url = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = 'async';
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('El dispositivo no puede decodificar esta fotografía.'));
      image.src = url;
    });
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      // WebKit may still need the object URL while drawImage consumes the decoded
      // HTMLImageElement. Revoke it only after prepareProgressPhoto finishes.
      close: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

export async function prepareProgressPhoto(file: File): Promise<{ blob: Blob; mimeType: string; width: number; height: number }> {
  validateProgressPhotoFile(file);
  const decoded = await decodeImage(file);
  try {
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
  if (!validProgressPhotoMeta(record) || !isProgressPhotoBlob(record.blob) || record.blob.size > MAX_OUTPUT_BYTES) {
    throw new Error('La fotografía preparada no es válida.');
  }
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('No se pudo guardar la fotografía.'));
  });
  db.close();
}

export async function loadProgressPhotos(): Promise<ProgressPhotoRecord[]> {
  const db = await openDb();
  const result = await new Promise<ProgressPhotoRecord[]>((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
    request.onsuccess = () => resolve((request.result as ProgressPhotoRecord[]).filter(item => validProgressPhotoMeta(item) && isProgressPhotoBlob(item.blob)));
    request.onerror = () => reject(request.error ?? new Error('No se pudieron cargar las fotografías.'));
  });
  db.close();
  return result.sort((a, b) => a.localDate.localeCompare(b.localDate) || a.createdAt.localeCompare(b.createdAt));
}

export async function removeProgressPhoto(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('No se pudo eliminar la fotografía.'));
  });
  db.close();
}
