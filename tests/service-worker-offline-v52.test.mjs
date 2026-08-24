import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');

test('service worker no se activa con un app shell offline incompleto', () => {
  assert.equal(sw.includes('Promise.allSettled'), false, 'El install no debe ocultar fallos al precachear recursos críticos');
  assert.match(sw, /Promise\.all\(A\.map\(/, 'El app shell completo debe ser requisito para terminar la instalación');
  assert.match(sw, /if\(!r\.ok\)throw new Error/, 'Las respuestas HTTP fallidas deben abortar la instalación del service worker');
});

test('navegación offline conserva fallback al index cacheado', () => {
  assert.match(sw, /e\.request\.mode==='navigate'/);
  assert.match(sw, /catch\(\(\)=>caches\.match\('\.\/index\.html'\)\)/);
});
