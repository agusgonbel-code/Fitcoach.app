import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../evidence-plan-v342.js', import.meta.url), 'utf8');
const context = { globalThis: {} };
vm.runInNewContext(source, context);
const api = context.globalThis.FitCoachEvidencePlan;

test('crea cuatro sesiones consecutivas de lunes a jueves', () => {
  const plan = api.buildPlan({ start: '2026-08-17', weeks: 8 });
  assert.deepEqual(Object.keys(plan.routine), ['Lunes', 'Martes', 'Miércoles', 'Jueves']);
  assert.equal(plan.days, 4);
  assert.equal(plan.minutes, 50);
});

test('todas las sesiones respetan el límite temporal', () => {
  for (const day of Object.keys(api.routine)) assert.ok(api.estimatedMinutes(day) <= 50, `${day} supera 50 min`);
});

test('prescribe volumen, RIR, descanso y alternativa en cada ejercicio', () => {
  for (const exercises of Object.values(api.routine)) for (const item of exercises) {
    assert.ok(item.sets >= 2 && item.sets <= 3);
    assert.equal(item.rir, '1-3');
    assert.ok(item.rest >= 60 && item.rest <= 150);
    assert.ok(item.alt);
  }
});

test('incluye progresión y respaldo científico', () => {
  const plan = api.buildPlan({ start: '2026-08-17' });
  assert.match(plan.progression, /2,5-5%/);
  assert.ok(plan.references.length >= 4);
});
