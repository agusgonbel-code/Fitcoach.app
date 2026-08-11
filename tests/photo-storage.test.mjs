import assert from 'node:assert/strict';
await import('../photo-storage-v34.js');

const {
  MAX_INPUT_BYTES, MAX_STORED_BYTES, isSupportedPhoto, fittedSize
} = globalThis.FitCoachPhoto;

assert.equal(MAX_INPUT_BYTES, 25 * 1024 * 1024);
assert.equal(MAX_STORED_BYTES, 5 * 1024 * 1024);
assert.equal(isSupportedPhoto({ name: 'progreso.HEIC', type: '', size: 1024 }), true);
assert.equal(isSupportedPhoto({ name: 'progreso', type: 'image/heif', size: 1024 }), true);
assert.equal(isSupportedPhoto({ name: 'vector.svg', type: 'image/svg+xml', size: 1024 }), false);
assert.equal(isSupportedPhoto({ name: 'foto.jpg', type: 'image/jpeg', size: 26 * 1024 * 1024 }), false);
assert.equal(isSupportedPhoto({ name: 'vacía.jpg', type: 'image/jpeg', size: 0 }), false);

assert.deepEqual(fittedSize(4032, 3024), { width: 1600, height: 1200 });
assert.deepEqual(fittedSize(3024, 4032, 1200), { width: 900, height: 1200 });
assert.deepEqual(fittedSize(800, 600), { width: 800, height: 600 });
assert.throws(() => fittedSize(0, 600));

console.log('Photo storage tests passed');
