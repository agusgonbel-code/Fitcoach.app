(() => {
  'use strict';
  const number = (value, min, max, allowBlank = false) => {
    if (value === '' || value == null) return allowBlank ? null : NaN;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : NaN;
  };
  function normaliseWorkoutInput(exercises, notes = '') {
    let completedSets = 0;
    const cleanExercises = (Array.isArray(exercises) ? exercises : []).map(exercise => ({
      name: String(exercise?.name || '').slice(0, 100),
      sets: (Array.isArray(exercise?.sets) ? exercise.sets : []).map(set => {
        const kg = number(set?.kg, 0, 1000, true);
        const reps = number(set?.reps, 1, 100, true);
        const rir = number(set?.rir, 0, 10, true);
        const entered = kg !== null || reps !== null || rir !== null;
        const valid = !entered || (Number.isFinite(kg) && Number.isFinite(reps) && (rir === null || Number.isFinite(rir)));
        if (entered && valid) completedSets += 1;
        return { kg, reps, rir, entered, valid };
      })
    }));
    const invalid = cleanExercises.some(exercise => exercise.sets.some(set => !set.valid));
    return {
      valid: !invalid && completedSets > 0,
      reason: invalid
        ? 'Revisa las series: peso 0–1000 kg, repeticiones 1–100 y RIR 0–10.'
        : completedSets ? '' : 'Completa al menos una serie antes de guardar.',
      completedSets,
      notes: String(notes || '').slice(0, 500),
      exercises: cleanExercises.map(exercise => ({
        name: exercise.name,
        sets: exercise.sets.filter(set => set.entered && set.valid).map(({ kg, reps, rir }) => ({ kg, reps, rir }))
      })).filter(exercise => exercise.sets.length)
    };
  }
  function readForm() {
    const plan = JSON.parse(localStorage.getItem('fitcoach_active_plan_v33') || 'null');
    const day = document.getElementById('trainingDay')?.value;
    const routine = plan?.routine?.[day] || [];
    const exercises = [...document.querySelectorAll('#workout .exercise[data-ex]')].map((box, index) => ({
      name: routine[index]?.name || box.querySelector('h3')?.textContent || '',
      sets: [...box.querySelectorAll('.setrow')].map(row => ({
        kg: row.querySelector('.kg')?.value ?? '',
        reps: row.querySelector('.reps')?.value ?? '',
        rir: row.querySelector('.rir')?.value ?? ''
      }))
    }));
    return { plan, day, result: normaliseWorkoutInput(exercises, document.getElementById('notes')?.value) };
  }
  function showError(message) {
    let status = document.getElementById('workoutSaveStatus');
    if (!status) {
      status = document.createElement('div');
      status.id = 'workoutSaveStatus';
      status.className = 'notice';
      status.setAttribute('role', 'alert');
      document.getElementById('saveWorkout')?.before(status);
    }
    status.textContent = message;
    status.scrollIntoView?.({ block: 'nearest' });
  }
  if (typeof document !== 'undefined') document.addEventListener('click', event => {
    if (event.target?.id !== 'saveWorkout') return;
    let snapshot;
    try { snapshot = readForm(); } catch { return; }
    if (!snapshot.plan) return;
    if (!snapshot.result.valid) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showError(snapshot.result.reason);
      return;
    }
    setTimeout(() => {
      let workouts;
      try { workouts = JSON.parse(localStorage.getItem('workouts') || '[]'); } catch { return; }
      if (!Array.isArray(workouts) || !workouts.length) return;
      const saved = workouts.at(-1);
      if (saved?.day !== snapshot.day) return;
      workouts[workouts.length - 1] = {
        ...saved,
        exercises: snapshot.result.exercises,
        notes: snapshot.result.notes
      };
      localStorage.setItem('workouts', JSON.stringify(workouts));
    }, 0);
  }, true);
  globalThis.FitCoachWorkoutSave = { normaliseWorkoutInput };
})();
