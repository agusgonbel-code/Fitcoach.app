import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const accessibility = require('../accessibility-v348.js');
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('la navegación accesible expone una sola página actual', () => {
  const state = accessibility.navigationState(['home', 'plan', 'training'], 'training');
  assert.deepEqual(state, [
    { id: 'home', current: false, hidden: true },
    { id: 'plan', current: false, hidden: true },
    { id: 'training', current: true, hidden: false }
  ]);
});

test('el runtime instala etiquetas, pestañas, estados y navegación asistida', () => {
  const source = read('accessibility-v348.js');
  const loader = read('daily-coach-v34.js');
  const styles = read('accessibility-v348.css');
  const worker = read('sw.js');

  assert.match(loader, /accessibility-v348\.js\?v=3\.4\.4/);
  assert.match(source, /accessibility-v348\.css\?v=3\.4\.4/);
  assert.match(source, /aria-label', 'Navegación principal'/);
  assert.match(source, /aria-current/);
  assert.match(source, /aria-selected/);
  assert.match(source, /role', 'status'/);
  assert.match(source, /ArrowLeft/);
  assert.match(source, /label\.htmlFor/);
  assert.doesNotMatch(source, /observe\(document\.body/);
  assert.match(source, /observer\.observe\(main/);
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(worker, /accessibility-v348\.js\?v=3\.4\.4/);
});
