(() => {
  'use strict';

  const PREFIX = 'fitcoach_workout_draft_v1:';
  const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
  const readPlan = () => {
    try { return JSON.parse(localStorage.getItem('fitcoach_active_plan_v33')); }
    catch { return null; }
  };
  const cleanText = (value, max = 120) => String(value ?? '').slice(0, max);

  function fingerprintPlan(plan) {
    const days = Object.entries(plan?.routine || {}).map(([day, exercises]) => [
      day,
      (Array.isArray(exercises) ? exercises : []).map(exercise => cleanText(exercise?.name, 100))
    ]);
    const source = JSON.stringify({
      id: plan?.id || '', protocol: plan?.protocol || '', method: plan?.method || '',
      start: plan?.start || '', days
    });
    let hash = 2166136261;
    for (let index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function draftKey(plan, day) {
    return `${PREFIX}${fingerprintPlan(plan)}:${encodeURIComponent(cleanText(day, 30))}`;
  }

  function normaliseDraft(value) {
    if (!value || value.version !== 1 || !Array.isArray(value.exercises)) return null;
    const updatedAt = Number(value.updatedAt);
    if (!Number.isFinite(updatedAt) || updatedAt <= 0) return null;
    const exercises = value.exercises.slice(0, 30).map((exercise, index) => ({
      index: Number.isInteger(exercise?.index) && exercise.index >= 0 ? exercise.index : index,
      name: cleanText(exercise?.name, 100),
      sets: (Array.isArray(exercise?.sets) ? exercise.sets : []).slice(0, 20).map(set => ({
        kg: cleanText(set?.kg, 12), reps: cleanText(set?.reps, 8), rir: cleanText(set?.rir, 5)
      }))
    })).filter(exercise => exercise.name);
    if (!exercises.length) return null;
    return {
      version: 1,
      planFingerprint: cleanText(value.planFingerprint, 24),
      day: cleanText(value.day, 30),
      updatedAt,
      notes: cleanText(value.notes, 500),
      exercises
    };
  }

  function isDraftFor(draft, plan, day) {
    return Boolean(draft && draft.planFingerprint === fingerprintPlan(plan) && draft.day === cleanText(day, 30));
  }

  function currentDraft() {
    const plan = readPlan();
    const day = document.getElementById('trainingDay')?.value;
    const workout = document.getElementById('workout');
    if (!plan || !day || !workout) return null;
    const routine = plan.routine?.[day] || [];
    const exercises = [...workout.querySelectorAll('.exercise[data-ex]')].map((box, index) => ({
      index,
      name: cleanText(routine[index]?.name || box.querySelector('h3')?.textContent, 100),
      sets: [...box.querySelectorAll('.setrow')].map(row => ({
        kg: row.querySelector('.kg')?.value || '',
        reps: row.querySelector('.reps')?.value || '',
        rir: row.querySelector('.rir')?.value || ''
      }))
    })).filter(exercise => exercise.name);
    if (!exercises.length) return null;
    return normaliseDraft({
      version: 1,
      planFingerprint: fingerprintPlan(plan),
      day,
      updatedAt: Date.now(),
      notes: document.getElementById('notes')?.value || '',
      exercises
    });
  }

  function saveCurrentDraft() {
    const plan = readPlan();
    const draft = currentDraft();
    if (!plan || !draft) return;
    localStorage.setItem(draftKey(plan, draft.day), JSON.stringify(draft));
  }

  function restoreCurrentDraft() {
    const plan = readPlan();
    const day = document.getElementById('trainingDay')?.value;
    if (!plan || !day) return false;
    let draft;
    try { draft = normaliseDraft(JSON.parse(localStorage.getItem(draftKey(plan, day)))); }
    catch { draft = null; }
    if (!isDraftFor(draft, plan, day)) return false;
    const boxes = [...document.querySelectorAll('#workout .exercise[data-ex]')];
    if (!boxes.length) return false;
    draft.exercises.forEach(exercise => {
      const box = boxes[exercise.index];
      if (!box) return;
      const heading = cleanText(box.querySelector('h3')?.textContent, 100);
      if (heading && heading !== exercise.name) return;
      [...box.querySelectorAll('.setrow')].forEach((row, index) => {
        const set = exercise.sets[index];
        if (!set) return;
        const kg = row.querySelector('.kg'); const reps = row.querySelector('.reps'); const rir = row.querySelector('.rir');
        if (kg) kg.value = set.kg;
        if (reps) reps.value = set.reps;
        if (rir) rir.value = set.rir;
      });
    });
    const notes = document.getElementById('notes');
    if (notes) notes.value = draft.notes;
    return true;
  }

  function pruneDrafts(now = Date.now()) {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (!key?.startsWith(PREFIX)) continue;
      try {
        const draft = normaliseDraft(JSON.parse(localStorage.getItem(key)));
        if (!draft || now - draft.updatedAt > MAX_AGE_MS) localStorage.removeItem(key);
      } catch { localStorage.removeItem(key); }
    }
  }

  function init() {
    pruneDrafts();
    const workout = document.getElementById('workout');
    const daySelect = document.getElementById('trainingDay');
    const notes = document.getElementById('notes');
    const save = document.getElementById('saveWorkout');
    if (!workout || !daySelect) return;
    let restoreTimer;
    const scheduleRestore = () => {
      clearTimeout(restoreTimer);
      restoreTimer = setTimeout(restoreCurrentDraft, 0);
    };
    workout.addEventListener('input', saveCurrentDraft);
    workout.addEventListener('change', saveCurrentDraft);
    notes?.addEventListener('input', saveCurrentDraft);
    daySelect.addEventListener('change', scheduleRestore);
    new MutationObserver(scheduleRestore).observe(workout, { childList: true });
    save?.addEventListener('click', () => {
      const plan = readPlan();
      const day = daySelect.value;
      let before = 0;
      try { before = (JSON.parse(localStorage.getItem('workouts')) || []).length; } catch {}
      setTimeout(() => {
        let after = before;
        try { after = (JSON.parse(localStorage.getItem('workouts')) || []).length; } catch {}
        if (plan && after > before) localStorage.removeItem(draftKey(plan, day));
      }, 0);
    }, true);
    addEventListener('pagehide', saveCurrentDraft);
    document.addEventListener('visibilitychange', () => { if (document.hidden) saveCurrentDraft(); });
    scheduleRestore();
  }

  globalThis.FitCoachWorkoutDraft = { fingerprintPlan, draftKey, normaliseDraft, isDraftFor };
  if (typeof document !== 'undefined') {
    document.readyState === 'loading'
      ? document.addEventListener('DOMContentLoaded', () => setTimeout(init, 0), { once: true })
      : setTimeout(init, 0);
  }
})();
