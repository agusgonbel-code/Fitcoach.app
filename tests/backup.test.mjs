import assert from 'node:assert/strict';
await import('../local-date-v345.js');
await import('../backup-v34.js');

const {
  SCHEMA, SCHEMA_VERSION, APP_VERSION, MAX_PHOTO_BYTES, MAX_TOTAL_PHOTO_BYTES,
  STORAGE_KEYS, dataUrlBytes, backupFileName, validateJson, validateBackupPayload
} = globalThis.FitCoachBackup;

const tinyJpeg = 'data:image/jpeg;base64,/9j/2Q==';
const valid = {
  schema: SCHEMA,
  schemaVersion: SCHEMA_VERSION,
  appVersion: APP_VERSION,
  exportedAt: '2026-08-11T12:00:00.000Z',
  local: {
    profile: { name: 'Agustín' },
    fitcoach_priorities_v33: ['Hombros'],
    v34meas: [{ id: 'm1', date: '2026-08-11', weight: 81 }]
  },
  photos: [{
    id: 'p1',
    date: '2026-08-11',
    pose: 'Frontal',
    originalBytes: 6,
    storedBytes: 4,
    dataUrl: tinyJpeg
  }]
};

assert.equal(SCHEMA, 'fitcoach-backup');
assert.equal(SCHEMA_VERSION, 1);
assert.equal(APP_VERSION, '3.4.3');
assert.equal(backupFileName(new Date(2026, 7, 14, 0, 5)), 'fitcoach-backup-3.4.3-2026-08-14.json');
assert.equal(MAX_PHOTO_BYTES, 25 * 1024 * 1024);
assert.equal(MAX_TOTAL_PHOTO_BYTES, 75 * 1024 * 1024);
assert.equal(STORAGE_KEYS.includes('v34meas'), true);
assert.equal(STORAGE_KEYS.includes('fitcoach_priorities_v33'), true);
assert.deepEqual(dataUrlBytes(tinyJpeg), { type: 'image/jpeg', bytes: 4 });
assert.deepEqual(validateBackupPayload(valid), { photoCount: 1, totalPhotoBytes: 4 });

assert.throws(
  () => validateBackupPayload({ ...valid, schema: 'foreign-app' }),
  /versión compatible/
);
assert.throws(
  () => validateBackupPayload({ ...valid, local: { unknown: [] } }),
  /sección no permitida/
);
assert.throws(
  () => validateBackupPayload({ ...valid, photos: [{ ...valid.photos[0], dataUrl: 'data:text/html;base64,PGgxPg==' }] }),
  /formato de copia/
);
assert.throws(
  () => validateBackupPayload({ ...valid, photos: [valid.photos[0], { ...valid.photos[0] }] }),
  /repetido/
);
assert.throws(
  () => validateBackupPayload({ ...valid, photos: [{ ...valid.photos[0], date: '11/08/2026' }] }),
  /fecha/
);
assert.throws(() => validateJson({ constructor: 'blocked' }), /clave no permitida/);
assert.throws(() => validateJson({ note: 'x'.repeat(10001) }), /texto demasiado largo/);

console.log('Backup validation tests passed');
