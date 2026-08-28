import { describe, expect, it } from 'vitest';
import { isProgressPhotoBlob, shouldKeepOriginalProgressPhoto, validProgressPhotoMeta, validateProgressPhotoFile } from './progressPhotoRepository';

describe('progress photo safety', () => {
  it('accepts valid local metadata', () => {
    expect(validProgressPhotoMeta({ id: 'p1', localDate: '2026-08-27', pose: 'front', weightKg: 80.2, mimeType: 'image/jpeg', width: 1200, height: 1600, createdAt: '2026-08-27T00:30:00.000Z' })).toBe(true);
  });

  it('rejects impossible weight, pose, civil date, timestamp and dimensions', () => {
    expect(validProgressPhotoMeta({ id: 'p1', localDate: '27/08/2026', pose: 'front', weightKg: 10, mimeType: 'image/jpeg', width: 1200, height: 1600, createdAt: 'x' })).toBe(false);
    expect(validProgressPhotoMeta({ id: 'p1', localDate: '2026-02-31', pose: 'front', weightKg: 80, mimeType: 'image/jpeg', width: 1200, height: 1600, createdAt: '2026-02-28T10:00:00.000Z' })).toBe(false);
    expect(validProgressPhotoMeta({ id: 'p1', localDate: '2026-02-28', pose: 'front', weightKg: 80, mimeType: 'image/jpeg', width: 1200, height: 1600, createdAt: 'not-a-timestamp' })).toBe(false);
    expect(validProgressPhotoMeta({ id: 'p1', localDate: '2026-02-28', pose: 'front', weightKg: 80, mimeType: 'image/jpeg', width: Number.POSITIVE_INFINITY, height: 1600, createdAt: '2026-02-28T10:00:00.000Z' })).toBe(false);
    expect(validProgressPhotoMeta({ id: 'p1', localDate: '2026-02-28', pose: 'front', weightKg: 80, mimeType: 'image/jpeg', width: 1801, height: 1600, createdAt: '2026-02-28T10:00:00.000Z' })).toBe(false);
  });

  it('rejects oversized files', () => {
    expect(() => validateProgressPhotoFile({ size: 26 * 1024 * 1024, type: 'image/jpeg' })).toThrow('25 MB');
  });

  it('accepts iPhone HEIC metadata and rejects unrelated files', () => {
    expect(() => validateProgressPhotoFile({ size: 4_000_000, type: 'image/heic' })).not.toThrow();
    expect(() => validateProgressPhotoFile({ size: 1000, type: 'application/pdf' })).toThrow('Formato no compatible');
  });

  it('keeps already-small browser-native images but still recompresses HEIC, large files and oversized dimensions', () => {
    expect(shouldKeepOriginalProgressPhoto({ size: 1024, type: 'image/png' }, 32, 32)).toBe(true);
    expect(shouldKeepOriginalProgressPhoto({ size: 1024, type: 'image/jpeg' }, 1200, 1600)).toBe(true);
    expect(shouldKeepOriginalProgressPhoto({ size: 1024, type: 'image/heic' }, 1200, 1600)).toBe(false);
    expect(shouldKeepOriginalProgressPhoto({ size: 3 * 1024 * 1024, type: 'image/jpeg' }, 1200, 1600)).toBe(false);
    expect(shouldKeepOriginalProgressPhoto({ size: 1024, type: 'image/webp' }, 2000, 1200)).toBe(false);
  });

  it('accepts a bounded image blob-shaped IndexedDB clone without relying on instanceof', () => {
    const clonedBlob = Object.assign(Object.create(null), {
      size: 1024,
      type: 'image/jpeg',
      slice: () => clonedBlob,
      arrayBuffer: async () => new ArrayBuffer(1024),
    });
    expect(isProgressPhotoBlob(clonedBlob)).toBe(true);
    expect(isProgressPhotoBlob({ size: 1024, type: 'image/jpeg' })).toBe(false);
    expect(isProgressPhotoBlob({ ...clonedBlob, size: 3 * 1024 * 1024 })).toBe(false);
    expect(isProgressPhotoBlob({ ...clonedBlob, type: 'application/octet-stream' })).toBe(false);
  });
});
