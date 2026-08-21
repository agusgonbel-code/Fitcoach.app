import test from 'node:test';
import assert from 'node:assert/strict';
import timer from '../rest-timer-v349.js';

test('normaliza descansos dentro de un rango seguro', () => {
  assert.equal(timer.normaliseSeconds(120), 120);
  assert.equal(timer.normaliseSeconds(10), 30);
  assert.equal(timer.normaliseSeconds(900), 300);
  assert.equal(timer.normaliseSeconds('inválido', 75), 75);
});

test('calcula el tiempo por instante final para sobrevivir a la suspensión de iOS', () => {
  assert.deepEqual(timer.timerState(61_000, 1_000), { remaining: 60, complete: false });
  assert.deepEqual(timer.timerState(1_000, 1_001), { remaining: 0, complete: true });
  assert.equal(timer.formatTime(125), '2:05');
});

test('expone una clave de sesión estable', () => {
  assert.equal(timer.STORAGE_KEY, 'fitcoach_rest_timer_v1');
});
