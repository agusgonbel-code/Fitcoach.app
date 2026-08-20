(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.FitCoachRestTimer = api;
  if (root.document) api.install(root.document, root);
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STORAGE_KEY = 'fitcoach_rest_timer_v1';
  const MINIMUM_SECONDS = 30;
  const MAXIMUM_SECONDS = 300;

  function normaliseSeconds(value, fallback = 90) {
    const parsed = Math.round(Number(value));
    const safeFallback = Math.min(MAXIMUM_SECONDS, Math.max(MINIMUM_SECONDS, Math.round(Number(fallback) || 90)));
    return Number.isFinite(parsed)
      ? Math.min(MAXIMUM_SECONDS, Math.max(MINIMUM_SECONDS, parsed))
      : safeFallback;
  }

  function timerState(endAt, now = Date.now()) {
    const end = Number(endAt);
    const current = Number(now);
    if (!Number.isFinite(end) || !Number.isFinite(current)) return { remaining: 0, complete: true };
    const remaining = Math.max(0, Math.ceil((end - current) / 1000));
    return { remaining, complete: remaining === 0 };
  }

  function formatTime(seconds) {
    const safe = Math.max(0, Math.round(Number(seconds) || 0));
    return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
  }

  function readPlan(view) {
    try { return JSON.parse(view.localStorage.getItem('fitcoach_active_plan_v33') || 'null'); }
    catch { return null; }
  }

  function readTimer(view) {
    try {
      const value = JSON.parse(view.sessionStorage.getItem(STORAGE_KEY) || 'null');
      if (!value || !Number.isFinite(Number(value.endAt))) return null;
      return { endAt: Number(value.endAt), seconds: normaliseSeconds(value.seconds), exercise: String(value.exercise || '').slice(0, 100) };
    } catch { return null; }
  }

  function install(document, view = globalThis) {
    const workout = document.getElementById('workout');
    const guide = document.getElementById('weekGuide');
    if (!workout || !guide || !view.sessionStorage) return;

    const style = document.createElement('style');
    style.textContent = '.restTimerPanel{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:10px}.restTimerPanel[hidden]{display:none}.restTimerClock{font-size:30px;font-weight:900;font-variant-numeric:tabular-nums}.restTimerActions{display:flex;gap:8px}.restTimerActions button,.startRestTimer{min-height:44px}.startRestTimer{width:100%;margin-top:8px;background:#e8eefc;color:#1d4ed8}.restTimerComplete{color:#047857}';
    document.head.appendChild(style);

    const panel = document.createElement('div');
    panel.id = 'fcRestTimer';
    panel.className = 'card restTimerPanel';
    panel.hidden = true;
    panel.setAttribute('role', 'timer');
    panel.setAttribute('aria-live', 'polite');
    panel.innerHTML = '<div><div id="fcRestTimerLabel" class="muted">Descanso</div><div id="fcRestTimerClock" class="restTimerClock">0:00</div></div><div class="restTimerActions"><button id="fcRestMinus" type="button" class="secondary" aria-label="Restar 15 segundos">−15</button><button id="fcRestPlus" type="button" class="secondary" aria-label="Añadir 15 segundos">+15</button><button id="fcRestSkip" type="button" class="secondary">Omitir</button></div>';
    guide.after(panel);

    const clock = panel.querySelector('#fcRestTimerClock');
    const label = panel.querySelector('#fcRestTimerLabel');
    let timer = readTimer(view);
    let announcedComplete = false;
    let interval = null;

    const save = () => {
      if (timer) view.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(timer));
      else view.sessionStorage.removeItem(STORAGE_KEY);
    };
    const render = () => {
      if (!timer) {
        panel.hidden = true;
        if (interval !== null) { view.clearInterval(interval); interval = null; }
        return;
      }
      const state = timerState(timer.endAt);
      panel.hidden = false;
      label.textContent = state.complete ? 'Descanso terminado' : `Descanso · ${timer.exercise || 'siguiente serie'}`;
      clock.textContent = formatTime(state.remaining);
      clock.classList.toggle('restTimerComplete', state.complete);
      if (state.complete && !announcedComplete) {
        announcedComplete = true;
        view.navigator?.vibrate?.([120, 80, 120]);
        save();
      }
      if (state.complete && interval !== null) { view.clearInterval(interval); interval = null; }
    };
    const ensureInterval = () => {
      if (interval !== null) return;
      interval = view.setInterval(render, 250);
    };
    const start = (seconds, exercise = '') => {
      const duration = normaliseSeconds(seconds);
      timer = { endAt: Date.now() + duration * 1000, seconds: duration, exercise: String(exercise).slice(0, 100) };
      announcedComplete = false;
      save(); render(); ensureInterval();
      return timer;
    };
    const adjust = amount => {
      if (!timer || timerState(timer.endAt).complete) return;
      const next = timerState(timer.endAt).remaining + amount;
      if (next <= 0) { clear(); return; }
      const remaining = Math.min(MAXIMUM_SECONDS, next);
      timer.endAt = Date.now() + remaining * 1000;
      timer.seconds = remaining;
      save(); render();
    };
    const clear = () => {
      timer = null;
      announcedComplete = false;
      if (interval !== null) { view.clearInterval(interval); interval = null; }
      save(); render();
    };

    panel.querySelector('#fcRestMinus').addEventListener('click', () => adjust(-15));
    panel.querySelector('#fcRestPlus').addEventListener('click', () => adjust(15));
    panel.querySelector('#fcRestSkip').addEventListener('click', clear);

    function decorateExercises() {
      const plan = readPlan(view);
      const day = document.getElementById('trainingDay')?.value;
      const prescription = plan?.routine?.[day] || [];
      workout.querySelectorAll('.exercise[data-ex]').forEach((box, index) => {
        if (box.querySelector('.startRestTimer')) return;
        const exercise = prescription[index];
        const seconds = normaliseSeconds(exercise?.rest, 90);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'startRestTimer secondary';
        button.textContent = `Iniciar descanso · ${seconds} s`;
        button.setAttribute('aria-label', `Iniciar descanso de ${seconds} segundos para ${exercise?.name || 'este ejercicio'}`);
        button.addEventListener('click', () => start(seconds, exercise?.name || box.querySelector('h3')?.textContent || ''));
        box.appendChild(button);
      });
    }

    new MutationObserver(decorateExercises).observe(workout, { childList: true });
    document.getElementById('trainingDay')?.addEventListener('change', () => view.setTimeout(decorateExercises, 0));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
    decorateExercises();
    if (timer && !timerState(timer.endAt).complete) ensureInterval();
    render();
  }

  return { STORAGE_KEY, normaliseSeconds, timerState, formatTime, install };
}));
