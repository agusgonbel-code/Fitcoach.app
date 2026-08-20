import assert from 'node:assert/strict';
await import('../daily-coach-v34.js');
const source = await import('node:fs/promises').then(fs => fs.readFile(new URL('../daily-coach-v34.js', import.meta.url), 'utf8'));

const { localDateKey, normaliseSet, buildWorkoutRecord, dashboardModel } = globalThis.FitCoachDaily;
const localDate = (day, hour = 12) => new Date(2026, 7, day, hour);
const localIso = (day, hour = 12) => localDate(day, hour).toISOString();

assert.equal(localDateKey(new Date(2026, 7, 11, 12)), '2026-08-11');
assert.deepEqual(normaliseSet({ kg: '80', reps: '10', rir: '0' }), { kg: 80, reps: 10, rir: 0 });
assert.deepEqual(normaliseSet({ kg: '0', reps: '12', rir: '' }), { kg: 0, reps: 12, rir: null });
assert.equal(normaliseSet({ kg: '-1', reps: '10', rir: '2' }), null);
assert.equal(normaliseSet({ kg: '80', reps: '0', rir: '2' }), null);
assert.equal(normaliseSet({ kg: '80', reps: '10', rir: '11' }), null);

const record = buildWorkoutRecord({
  day: 'Martes',
  date: new Date('2026-08-11T10:00:00.000Z'),
  notes: 'Buena técnica',
  exercises: [
    { name: 'Press banca', sets: [{ kg: '80', reps: '10', rir: '0' }, { kg: '', reps: '', rir: '' }] },
    { name: 'Remo', sets: [{ kg: '70', reps: '0', rir: '2' }] }
  ]
});
assert.equal(record.day, 'Martes');
assert.equal(record.exercises.length, 1);
assert.equal(record.exercises[0].sets[0].rir, 0);
assert.throws(() => buildWorkoutRecord({
  day: 'Martes',
  exercises: [{ name: 'Press banca', sets: [{ kg: '', reps: '', rir: '' }] }]
}), /Completa al menos una serie/);

const model = dashboardModel({
  today: localDate(11, 18),
  profile: { name: 'Agustín' },
  targets: { kcal: 3000, protein: 160 },
  plan: { days: 4, method: 'upperlower', routine: {
    Lunes: [{ name: 'Press banca' }],
    Martes: [{ name: 'Prensa' }, { name: 'Curl femoral' }],
    Miércoles: [{ name: 'Remo' }],
    Jueves: [{ name: 'Peso muerto rumano' }]
  } },
  workouts: [
    { date: localIso(10, 18), day: 'Lunes' },
    { date: localIso(11, 10), day: 'Martes' }
  ],
  meals: [
    { date: '2026-08-11', kcal: 900, protein: 65 },
    { date: '2026-08-11', kcal: 600, protein: 35 },
    { date: '2026-08-10', kcal: 3000, protein: 160 }
  ],
  metrics: [{ weight: 80.5 }, { weight: 81 }]
});
assert.equal(model.name, 'Agustín');
assert.equal(model.dayName, 'Martes');
assert.equal(model.routine.length, 2);
assert.equal(model.todayDone, true);
assert.equal(model.weekDone, 2);
assert.equal(model.adherence, 50);
assert.equal(model.calories, 1500);
assert.equal(model.caloriesLeft, 1500);
assert.equal(model.protein, 100);
assert.equal(model.proteinLeft, 60);
assert.equal(model.weight, 81);
assert.equal(model.weightDelta, 0.5);
assert.equal(model.insights.some(item => item.title === 'Sesión completada'), true);


const accurateCompletion = dashboardModel({
  today: localDate(11, 18),
  plan: { days: 4, routine: {
    Lunes: [{ name: 'Press banca' }],
    Martes: [{ name: 'Prensa' }],
    Miércoles: [{ name: 'Remo' }],
    Jueves: [{ name: 'Peso muerto rumano' }]
  } },
  workouts: [
    { date: localIso(11, 8), day: 'Lunes' },
    { date: localIso(10, 10), day: 'Lunes' },
    { date: localIso(10, 12), day: 'Lunes' }
  ]
});
assert.equal(accurateCompletion.todayDone, false, 'Otra sesión guardada hoy no completa la sesión prevista');
assert.equal(accurateCompletion.weekDone, 2, 'Los guardados duplicados de la misma sesión no inflan la adherencia');
assert.equal(accurateCompletion.adherence, 50);
assert.match(source, /addEventListener\('fitcoach:meals-changed', renderDashboard\)/);

console.log('Daily coach tests passed');
