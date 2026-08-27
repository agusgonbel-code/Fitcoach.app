import { describe, expect, it } from 'vitest';
import {
  completeBackupFileName,
  decodeProgressPhoto,
  encodeProgressPhoto,
  validateCompleteBackup,
  type FitCoachCompleteBackupV1,
} from './completeBackup';
import type { ProgressPhotoRecord } from './progressPhotoRepository';

const core: FitCoachCompleteBackupV1['core'] = {
  schema: 'fitcoach-next-backup',
  version: 1,
  exportedAt: '2026-08-27T10:00:00.000Z',
  data: { profile: null, sessions: [], foodLog: [], bodyMetrics: [] },
};

const photo: ProgressPhotoRecord = {
  id: 'photo-1',
  localDate: '2026-08-27',
  pose: 'front',
  weightKg: 80,
  mimeType: 'image/jpeg',
  width: 800,
  height: 1200,
  createdAt: '2026-08-27T08:00:00.000Z',
  blob: new Blob([new Uint8Array([1, 2, 3, 4, 5])], { type: 'image/jpeg' }),
};

describe('FitCoach Next complete backup', () => {
  it('round-trips progress-photo binary data without changing metadata', async () => {
    const encoded = await encodeProgressPhoto(photo);
    expect(encoded.byteLength).toBe(5);
    expect(encoded.base64.length).toBeGreaterThan(0);

    const decoded = decodeProgressPhoto(encoded);
    expect(decoded.id).toBe(photo.id);
    expect(decoded.pose).toBe('front');
    expect(decoded.weightKg).toBe(80);
    expect(decoded.blob.size).toBe(5);
    expect(Array.from(new Uint8Array(await decoded.blob.arrayBuffer()))).toEqual([1, 2, 3, 4, 5]);
  });

  it('validates a complete backup containing encoded photos', async () => {
    const encoded = await encodeProgressPhoto(photo);
    const backup: FitCoachCompleteBackupV1 = {
      schema: 'fitcoach-next-complete-backup',
      version: 1,
      exportedAt: '2026-08-27T10:00:00.000Z',
      core,
      nutritionPlan: null,
      progressPhotos: [encoded],
    };
    expect(validateCompleteBackup(backup).progressPhotos).toHaveLength(1);
  });

  it('rejects duplicate and corrupted progress photos before restore', async () => {
    const encoded = await encodeProgressPhoto(photo);
    const duplicate = {
      schema: 'fitcoach-next-complete-backup', version: 1, exportedAt: '2026-08-27T10:00:00.000Z',
      core, nutritionPlan: null, progressPhotos: [encoded, encoded],
    };
    expect(() => validateCompleteBackup(duplicate)).toThrow(/duplicadas/);

    const corrupted = {
      schema: 'fitcoach-next-complete-backup', version: 1, exportedAt: '2026-08-27T10:00:00.000Z',
      core, nutritionPlan: null, progressPhotos: [{ ...encoded, byteLength: 0 }],
    };
    expect(() => validateCompleteBackup(corrupted)).toThrow(/fotografías/);
  });

  it('uses the local civil date for complete-backup filenames', () => {
    expect(completeBackupFileName(new Date(2026, 7, 27, 23, 59))).toBe('fitcoach-next-complete-v1-2026-08-27.json');
  });
});
