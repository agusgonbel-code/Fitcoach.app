import { describe, expect, it } from 'vitest';
import { validProgressPhotoMeta, validateProgressPhotoFile } from './progressPhotoRepository';

describe('progress photo safety', () => {
  it('accepts valid local metadata', () => {
    expect(validProgressPhotoMeta({ id: 'p1', localDate: '2026-08-27', pose: 'front', weightKg: 80.2, mimeType: 'image/jpeg', width: 1200, height: 1600, createdAt: '2026-08-27T00:30:00.000Z' })).toBe(true);
  });

  it('rejects impossible weight or invalid pose/date', () => {
    expect(validProgressPhotoMeta({ id: 'p1', localDate: '27/08/2026', pose: 'front', weightKg: 10, mimeType: 'image/jpeg', width: 1200, height: 1600, createdAt: 'x' })).toBe(false);
  });

  it('rejects oversized files', () => {
    expect(() => validateProgressPhotoFile({ size: 26 * 1024 * 1024, type: 'image/jpeg' })).toThrow('25 MB');
  });

  it('accepts iPhone HEIC metadata and rejects unrelated files', () => {
    expect(() => validateProgressPhotoFile({ size: 4_000_000, type: 'image/heic' })).not.toThrow();
    expect(() => validateProgressPhotoFile({ size: 1000, type: 'application/pdf' })).toThrow('Formato no compatible');
  });
});
