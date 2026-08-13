(() => {
  'use strict';

  const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const METHOD_NAMES = {
    auto: 'FitCoach Adaptativo', weider: 'Weider', upperlower: 'Upper / Lower',
    ppl: 'Push / Pull / Legs', fullbody: 'Full Body', arnold: 'Arnold Split',
    phul: 'PHUL', phat: 'PHAT', powerbuilding: 'Powerbuilding',
    antagonist: 'Superseries antagonistas', heavy: 'Heavy Duty adaptado',
    five: '5x5 adaptado', specialization: 'Especialización'
  };
  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  };
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);

  function localDateKey(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const two = number => String(number).padStart(2, '0');
    return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`;
  }

  function normaliseSet(set) {
    const reps = Number(set?.reps);
    const kg = Number(set?.kg);
    const rawRir = set?.rir;
    if (!Number.isFinite(reps) || reps <= 0 || !Number.isFinite(kg) || kg < 0) return null;
    let rir = null;
    if (rawRir !== '' && rawRir !== null && rawRir !== undefined) {
      const value = Number(rawRir);
      if (!Number.isFinite(value) || value < 0 || value > 10) return null;
      rir = value;
    }
    return { kg, reps: Math.round(reps), rir };
  }

  function buildWorkoutRecord({ day, exercises, notes = '', date = new Date() }) {
    const cleanExercises = (Array.isArray(exercises) ? exercises : []).map(exercise => ({
      name: String(exercise?.name || '').trim().slice(0, 100),
      sets: (Array.isArray(exercise?.sets) ? exercise.sets : []).map(normaliseSet).filter(Boolean)
    })).filter(exercise => exercise.name && exercise.sets.length);
    if (!cleanExercises.length) throw new Error('Completa al menos una serie con repeticiones antes de guardar.');
    return {
      date: new Date(date).toISOString(),
      day: String(day || '').slice(0, 30),
      exercises: cleanExercises,
      notes: String(notes || '').trim().slice(0, 500)
    };
  }

  function dashboardModel({ today = new Date(), profile = {}, targets = {}, workouts = [], meals = [], metrics = [], plan = null }) {
    const now = today instanceof Date ? new Date(today) : new Date(today);
    if (Number.isNaN(now.getTime())) throw new Error('Fecha no válida');
    const todayKey = localDateKey(now);
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    const plannedDayNames = new Set(Object.entries(plan?.routine || {})
      .filter(([, exercises]) => Array.isArray(exercises) && exercises.length)
      .map(([day]) => day));
    const completedSessions = new Set();
    workouts.forEach(workout => {
      const date = new Date(workout?.date);
      const workoutDay = String(workout?.day || '');
      if (Number.isNaN(date.getTime()) || date < monday || date > now || !plannedDayNames.has(workoutDay)) return;
      completedSessions.add(`${localDateKey(date)}|${workoutDay}`);
    });
    const todayMeals = meals.filter(meal => String(meal?.date || '').slice(0, 10) === todayKey);
    const calories = todayMeals.reduce((sum, meal) => sum + (Number(meal?.kcal) || 0), 0);
    const protein = todayMeals.reduce((sum, meal) => sum + (Number(meal?.protein) || 0), 0);
    const targetCalories = Math.max(0, Number(targets?.kcal) || 0);
    const targetProtein = Math.max(0, Number(targets?.protein) || 0);
    const dayName = DAYS[now.getDay()];
    const routine = Array.isArray(plan?.routine?.[dayName]) ? plan.routine[dayName] : [];
    const todayDone = routine.length > 0 && workouts.some(workout =>
      localDateKey(workout?.date) === todayKey && String(workout?.day || '') === dayName
    );
    const plannedDays = Math.max(0, Number(plan?.days) || plannedDayNames.size);
    const weekDone = completedSessions.size;
    const adherence = plannedDays ? Math.min(100, Math.round(weekDone / plannedDays * 100)) : 0;
    const validWeights = metrics.map(metric => Number(metric?.weight)).filter(Number.isFinite);
    const weight = validWeights.at(-1) ?? null;
    const weightDelta = validWeights.length > 1 ? weight - validWeights.at(-2) : null;
    const insights = [];
    if (!plan) insights.push({ tone: 'amber', title: 'Falta tu plan', text: 'Configura días, objetivo y duración para recibir una sesión diaria.' });
    else if (routine.length && !todayDone) insights.push({ tone: 'green', title: 'Entrenamiento preparado', text: `${routine.length} ejercicios · registra peso, repeticiones y RIR.` });
    else if (todayDone) insights.push({ tone: 'green', title: 'Sesión completada', text: 'Buen trabajo. Prioriza recuperación, proteína y sueño.' });
    else insights.push({ tone: 'blue', title: 'Día sin sesión', text: 'Mantén actividad ligera y prepara el próximo entrenamiento.' });
    const proteinLeft = Math.max(0, targetProtein - protein);
    insights.push(proteinLeft > 0
      ? { tone: 'blue', title: 'Proteína pendiente', text: `Te quedan ${Math.round(proteinLeft)} g para alcanzar el objetivo de hoy.` }
      : { tone: 'green', title: 'Proteína cubierta', text: 'Has alcanzado el objetivo diario registrado.' });
    if (weightDelta !== null) insights.push({
      tone: Math.abs(weightDelta) <= 0.7 ? 'green' : 'amber',
      title: 'Último cambio de peso',
      text: `${weightDelta > 0 ? '+' : ''}${weightDelta.toFixed(1)} kg desde el registro anterior.`
    });
    return {
      name: String(profile?.name || 'Usuario').trim() || 'Usuario',
      dateLabel: new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(now),
      dayName, routine, todayDone, weekDone, plannedDays, adherence,
      calories, protein, targetCalories, targetProtein,
      caloriesLeft: Math.max(0, targetCalories - calories), proteinLeft,
      weight, weightDelta, plan, insights
    };
  }

  function currentData() {
    return {
      profile: read('profile', { name: 'Agustín' }),
      targets: read('targets', { kcal: 3000, protein: 160 }),
      workouts: read('workouts', []),
      meals: read('meals', []),
      metrics: read('metrics', []),
      plan: read('fitcoach_active_plan_v33', null)
    };
  }

  function navigate(id) {
    document.querySelector(`nav button[data-go="${id}"]`)?.click();
  }

  function injectDashboard() {
    const home = document.getElementById('home');
    if (!home || home.dataset.dailyCoach === '1') return;
    home.dataset.dailyCoach = '1';
    home.innerHTML = `
      <div class="fcHero">
        <div><div class="fcEyebrow" id="homeDate"></div><h1 id="greeting">Hola</h1>
        <p>Tu plan de hoy, progreso y decisiones importantes en un solo lugar.</p>
        <div class="fcActions"><button data-dash-go="training">Empezar sesión</button><button class="secondary" data-dash-go="plan">Editar plan</button></div></div>
        <div class="fcRing" id="homeRing"><div><strong id="homeWeek">0/0</strong><span>esta semana</span></div></div>
      </div>
      <div class="fcMetrics">
        <div class="fcMetric"><span>Proteína</span><strong id="homeProtein">0 g</strong><small id="homeProteinLeft">—</small></div>
        <div class="fcMetric"><span>Calorías</span><strong id="homeKcal">0</strong><small id="homeKcalLeft">—</small></div>
        <div class="fcMetric"><span>Peso</span><strong id="homeWeight">—</strong><small id="homeWeightDelta">Sin tendencia</small></div>
      </div>
      <div class="fcSectionHead"><div><span>HOY</span><h2 id="todayTitle">Sesión</h2></div><button class="fcTextButton" data-dash-go="training">Abrir entrenamiento →</button></div>
      <div id="activePlanCard"></div>
      <div class="fcSectionHead"><div><span>COACH</span><h2>Prioridades</h2></div></div>
      <div id="coach" class="fcCoachGrid"></div>`;
    home.querySelectorAll('[data-dash-go]').forEach(button => {
      button.onclick = () => navigate(button.dataset.dashGo);
    });
  }

  function renderDashboard() {
    injectDashboard();
    const home = document.getElementById('home');
    if (!home) return;
    const model = dashboardModel({ ...currentData(), today: new Date() });
    document.getElementById('greeting').textContent = 'Hola, ' + model.name;
    document.getElementById('homeDate').textContent = model.dateLabel;
    document.getElementById('homeWeek').textContent = `${model.weekDone}/${model.plannedDays}`;
    document.getElementById('homeRing').style.setProperty('--progress', model.adherence + '%');
    document.getElementById('homeProtein').textContent = Math.round(model.protein) + ' g';
    document.getElementById('homeProteinLeft').textContent = model.targetProtein ? Math.round(model.proteinLeft) + ' g pendientes' : 'Define objetivo';
    document.getElementById('homeKcal').textContent = Math.round(model.calories);
    document.getElementById('homeKcalLeft').textContent = model.targetCalories ? Math.round(model.caloriesLeft) + ' kcal restantes' : 'Define objetivo';
    document.getElementById('homeWeight').textContent = model.weight === null ? '—' : model.weight + ' kg';
    document.getElementById('homeWeightDelta').textContent = model.weightDelta === null ? 'Sin tendencia' : (model.weightDelta > 0 ? '+' : '') + model.weightDelta.toFixed(1) + ' kg';
    document.getElementById('todayTitle').textContent = model.todayDone ? 'Sesión completada' : model.routine.length ? model.dayName : 'Recuperación';
    document.getElementById('activePlanCard').innerHTML = model.plan ? `
      <div class="fcTodayCard">
        <div><span class="fcStatus ${model.todayDone ? 'done' : ''}">${model.todayDone ? 'COMPLETADO' : 'PREPARADO'}</span>
        <h3>${escapeHtml(METHOD_NAMES[model.plan.method] || 'Plan activo')}</h3>
        <p>${model.routine.length ? model.routine.length + ' ejercicios · ' + (model.plan.minutes || 60) + ' min' : 'Día sin entrenamiento programado'}</p></div>
        <button data-today-action>${model.todayDone ? 'Ver historial' : model.routine.length ? 'Entrenar ahora' : 'Ver plan'}</button>
      </div>` : `<div class="fcTodayCard empty"><div><span class="fcStatus warning">PENDIENTE</span><h3>Configura tu primer plan</h3><p>Elige objetivo, días y tiempo disponible.</p></div><button data-today-action>Crear plan</button></div>`;
    document.querySelector('[data-today-action]').onclick = () => navigate(model.plan ? (model.routine.length ? 'training' : 'plan') : 'plan');
    document.getElementById('coach').innerHTML = model.insights.map(insight => `
      <article class="fcInsight ${insight.tone}"><span></span><div><strong>${escapeHtml(insight.title)}</strong><p>${escapeHtml(insight.text)}</p></div></article>
    `).join('');
  }

  function lastExercise(workouts, name) {
    for (let index = workouts.length - 1; index >= 0; index -= 1) {
      const exercise = (workouts[index]?.exercises || []).find(item => item.name === name);
      if (exercise) return exercise;
    }
    return null;
  }

  function enhanceWorkout() {
    const workout = document.getElementById('workout');
    const daySelect = document.getElementById('trainingDay');
    if (!workout || !daySelect) return;
    const plan = read('fitcoach_active_plan_v33', null);
    const workouts = read('workouts', []);
    const day = daySelect.value;
    const exercises = plan?.routine?.[day] || [];
    workout.querySelectorAll('.exercise[data-ex]').forEach((box, index) => {
      const exerciseName = exercises[index]?.name;
      const exerciseHistory = workouts.flatMap(workout =>
        (workout?.exercises || []).filter(item => item.name === exerciseName)
      );
      const previous = exerciseHistory.at(-1) || null;
      const recommendation = globalThis.FitCoachProgression?.recommendProgression({
        history: exerciseHistory, targetReps: exercises[index]?.reps
      });
      if (recommendation && !box.querySelector('.fcProgressionHint')) {
        const hint = document.createElement('div');
        hint.className = 'notice fcProgressionHint';
        hint.dataset.tone = recommendation.tone;
        hint.textContent = 'Siguiente objetivo · ' + recommendation.text;
        box.querySelector('h3')?.after(hint);
      }
      if (!previous) return;
      box.classList.add('fcExerciseReady');
      box.querySelectorAll('.setrow').forEach((row, setIndex) => {
        const set = previous.sets?.[setIndex];
        if (!set || row.dataset.prefilled === '1') return;
        row.dataset.prefilled = '1';
        row.querySelector('.kg').value = Number.isFinite(Number(set.kg)) ? set.kg : '';
        row.querySelector('.reps').value = Number.isFinite(Number(set.reps)) ? set.reps : '';
        row.querySelector('.rir').value = set.rir === null || set.rir === undefined ? '' : set.rir;
      });
    });
    let guide = document.getElementById('dailySessionGuide');
    if (!guide) {
      guide = document.createElement('div');
      guide.id = 'dailySessionGuide';
      guide.className = 'fcSessionGuide';
      workout.before(guide);
    }
    guide.innerHTML = `<strong>${escapeHtml(day || 'Sesión')}</strong><span>${exercises.length} ejercicios · datos de la última sesión precargados</span>`;
  }

  function saveWorkoutGuided() {
    try {
      const plan = read('fitcoach_active_plan_v33', null);
      if (!plan) throw new Error('Activa un plan antes de guardar.');
      const day = document.getElementById('trainingDay').value;
      const routine = plan.routine?.[day] || [];
      const exercises = routine.map((exercise, index) => {
        const box = document.querySelector(`[data-ex="${index}"]`);
        return {
          name: exercise.name,
          sets: box ? [...box.querySelectorAll('.setrow')].map(row => ({
            kg: row.querySelector('.kg').value,
            reps: row.querySelector('.reps').value,
            rir: row.querySelector('.rir').value
          })) : []
        };
      });
      const record = buildWorkoutRecord({
        day, exercises, notes: document.getElementById('notes').value, date: new Date()
      });
      const workouts = read('workouts', []);
      workouts.push(record);
      localStorage.setItem('workouts', JSON.stringify(workouts));
      document.getElementById('notes').value = '';
      showToast(`Sesión guardada · ${record.exercises.length} ejercicios`);
      document.querySelector('nav button[data-go="training"]')?.click();
      setTimeout(() => { enhanceWorkout(); renderDashboard(); }, 0);
    } catch (error) {
      showToast(error?.message || 'No se pudo guardar la sesión.', true);
    }
  }

  function showToast(message, error = false) {
    let toast = document.getElementById('fcToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'fcToast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = error ? 'show error' : 'show';
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { toast.className = ''; }, 2800);
  }

  function init() {
    renderDashboard();
    const save = document.getElementById('saveWorkout');
    if (save) save.onclick = saveWorkoutGuided;
    const workout = document.getElementById('workout');
    if (workout) new MutationObserver(() => setTimeout(enhanceWorkout, 0)).observe(workout, { childList: true });
    document.getElementById('trainingDay')?.addEventListener('change', () => setTimeout(enhanceWorkout, 0));
    document.querySelectorAll('nav button').forEach(button => button.addEventListener('click', () => {
      if (button.dataset.go === 'home') setTimeout(renderDashboard, 0);
      if (button.dataset.go === 'training') setTimeout(enhanceWorkout, 0);
    }));
    enhanceWorkout();
    document.addEventListener('visibilitychange', () => { if (!document.hidden) renderDashboard(); });
  }

  globalThis.FitCoachDaily = {
    localDateKey, normaliseSet, buildWorkoutRecord, dashboardModel
  };

  if (typeof document !== 'undefined') {
    document.readyState === 'loading'
      ? document.addEventListener('DOMContentLoaded', () => setTimeout(init, 0), { once: true })
      : setTimeout(init, 0);
  }
})();
