import assert from 'node:assert/strict';
await import('../workout-draft-v343.js');

const { fingerprintPlan, draftKey, normaliseDraft, isDraftFor } = globalThis.FitCoachWorkoutDraft;
const plan = {
  id: 'evidence-upper-lower-4d-50', start: '2026-08-17', method: 'upperlower',
  routine: { Lunes: [{ name: 'Press banca' }], Martes: [{ name: 'Prensa' }] }
};
const samePlan = JSON.parse(JSON.stringify(plan));
const changedPlan = { ...samePlan, start: '2026-08-24' };

assert.equal(fingerprintPlan(plan), fingerprintPlan(samePlan));
assert.notEqual(fingerprintPlan(plan), fingerprintPlan(changedPlan));
assert.match(draftKey(plan, 'Lunes'), /^fitcoach_workout_draft_v1:/);
assert.notEqual(draftKey(plan, 'Lunes'), draftKey(plan, 'Martes'));

const draft = normaliseDraft({
  version: 1,
  planFingerprint: fingerprintPlan(plan),
  day: 'Lunes',
  updatedAt: 1_786_500_000_000,
  notes: 'Técnica controlada',
  exercises: [{
    index: 0,
    name: 'Press banca',
    sets: [{ kg: 80, reps: 10, rir: 0 }, { kg: '', reps: '', rir: '' }]
  }]
});

assert.equal(draft.exercises[0].sets[0].kg, '80');
assert.equal(draft.exercises[0].sets[0].rir, '0');
assert.equal(draft.notes, 'Técnica controlada');
assert.equal(isDraftFor(draft, plan, 'Lunes'), true);
assert.equal(isDraftFor(draft, plan, 'Martes'), false);
assert.equal(isDraftFor(draft, changedPlan, 'Lunes'), false);
assert.equal(normaliseDraft(null), null);
assert.equal(normaliseDraft({ version: 2, exercises: [] }), null);
assert.equal(normaliseDraft({ version: 1, updatedAt: 1, exercises: [] }), null);

console.log('Workout draft tests passed');
