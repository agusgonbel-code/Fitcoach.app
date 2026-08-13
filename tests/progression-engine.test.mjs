import assert from 'node:assert/strict';
await import('../progression-engine-v34.js');
const { parseRepRange, validSets, roundLoad, recommendProgression } = globalThis.FitCoachProgression;

assert.deepEqual(parseRepRange('6-10'), { minimum: 6, maximum: 10 });
assert.deepEqual(parseRepRange('8-12/cada'), { minimum: 8, maximum: 12 });
assert.equal(parseRepRange(''), null);
assert.equal(validSets({ sets: [{ kg: '80', reps: '10', rir: '0' }, { kg: '', reps: '', rir: '' }] }).length, 1);
assert.equal(validSets({ sets: [{ kg: '80', reps: '10', rir: '11' }] }).length, 0);
assert.equal(roundLoad(82, 2.5), 82.5);

const increase = recommendProgression({
  targetReps: '6-10',
  history: [{ sets: [{ kg: 80, reps: 10, rir: 2 }, { kg: 80, reps: 10, rir: 1 }] }]
});
assert.equal(increase.action, 'increase');
assert.equal(increase.suggestedKg, 82.5);

const addReps = recommendProgression({
  targetReps: '6-10',
  history: [{ sets: [{ kg: 80, reps: 8, rir: 2 }, { kg: 80, reps: 7, rir: 2 }] }]
});
assert.equal(addReps.action, 'add-reps');
assert.equal(addReps.suggestedKg, 80);

const confirmRir = recommendProgression({
  targetReps: '6-10',
  history: [{ sets: [{ kg: 80, reps: 10, rir: null }] }]
});
assert.equal(confirmRir.action, 'confirm-rir');

const reduceForEffort = recommendProgression({
  targetReps: '6-10',
  history: [{ sets: [{ kg: 80, reps: 8, rir: 0 }, { kg: 80, reps: 7, rir: 0 }] }]
});
assert.equal(reduceForEffort.action, 'reduce');
assert.equal(reduceForEffort.suggestedKg, 75);

const reduceForDecline = recommendProgression({
  targetReps: '6-10',
  history: [
    { sets: [{ kg: 80, reps: 10, rir: 2 }, { kg: 80, reps: 10, rir: 2 }] },
    { sets: [{ kg: 80, reps: 8, rir: 3 }, { kg: 80, reps: 8, rir: 3 }] }
  ]
});
assert.equal(reduceForDecline.action, 'reduce');
assert.equal(recommendProgression({ targetReps: '6-10', history: [] }).action, 'record');

console.log('Evidence-based progression tests passed');
