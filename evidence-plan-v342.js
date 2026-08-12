(() => {
  'use strict';

  const REFERENCES = [
    'PMID:37414459', 'PMID:41343037', 'PMID:38970765', 'PMID:39205815'
  ];
  const exercise = (name, muscle, sets, reps, rest, alt, note = '') => ({
    name, muscle, sets, reps, rest, rir: '1-3', alt, note
  });
  const ROUTINE = {
    Lunes: [
      exercise('Press banca con mancuernas', 'Pecho', 3, '6-10', 120, 'Press en máquina'),
      exercise('Remo con apoyo de pecho', 'Espalda', 3, '6-10', 120, 'Remo en máquina'),
      exercise('Press inclinado con mancuernas', 'Pecho', 2, '8-12', 90, 'Press inclinado en máquina'),
      exercise('Jalón al pecho', 'Espalda', 2, '8-12', 90, 'Dominada asistida'),
      exercise('Elevaciones laterales', 'Hombros', 2, '12-20', 60, 'Elevación lateral en polea'),
      exercise('Curl con barra EZ', 'Bíceps', 2, '10-15', 60, 'Curl en polea', 'Superserie con tríceps.'),
      exercise('Extensión de tríceps en polea', 'Tríceps', 2, '10-15', 60, 'Fondos asistidos', 'Superserie con bíceps.')
    ],
    Martes: [
      exercise('Prensa de piernas', 'Cuádriceps', 3, '6-10', 150, 'Sentadilla goblet', 'Usa rango sin dolor.'),
      exercise('Peso muerto rumano', 'Isquios', 3, '6-10', 150, 'Curl femoral sentado'),
      exercise('Extensión de cuádriceps', 'Cuádriceps', 2, '10-15', 75, 'Step-up bajo', 'Rango tolerable para la rodilla.'),
      exercise('Curl femoral sentado', 'Isquios', 2, '10-15', 75, 'Curl femoral tumbado'),
      exercise('Gemelo de pie', 'Gemelos', 2, '10-15', 60, 'Gemelo en prensa'),
      exercise('Crunch en polea', 'Core', 2, '10-15', 60, 'Reverse crunch')
    ],
    Miércoles: [
      exercise('Press militar sentado', 'Hombros', 3, '6-10', 120, 'Press de hombros en máquina'),
      exercise('Jalón neutro', 'Espalda', 3, '6-10', 120, 'Dominada asistida'),
      exercise('Press en máquina', 'Pecho', 2, '8-12', 90, 'Press banca con mancuernas'),
      exercise('Remo en polea', 'Espalda', 2, '8-12', 90, 'Remo unilateral con mancuerna'),
      exercise('Pájaros en máquina', 'Hombros', 2, '12-20', 60, 'Face pull'),
      exercise('Curl martillo', 'Bíceps', 2, '10-15', 60, 'Curl con cuerda', 'Superserie con tríceps.'),
      exercise('Tríceps por encima de la cabeza', 'Tríceps', 2, '10-15', 60, 'Press francés', 'Superserie con bíceps.')
    ],
    Jueves: [
      exercise('Hip thrust', 'Glúteos', 3, '6-10', 150, 'Hip thrust en máquina'),
      exercise('Hack squat', 'Cuádriceps', 3, '8-12', 150, 'Prensa de piernas', 'Usa rango sin dolor; cambia a prensa si molesta.'),
      exercise('Curl femoral tumbado', 'Isquios', 2, '10-15', 75, 'Curl femoral sentado'),
      exercise('Zancada atrás', 'Glúteos', 2, '8-12/cada', 90, 'Step-up bajo', 'Paso largo y rango tolerable.'),
      exercise('Gemelo sentado', 'Gemelos', 2, '10-15', 60, 'Gemelo en prensa'),
      exercise('Dead bug', 'Core', 2, '8-12/cada', 60, 'Plancha')
    ]
  };

  const clone = value => JSON.parse(JSON.stringify(value));
  function buildPlan({ start = new Date().toISOString().slice(0, 10), weeks = 8 } = {}) {
    const safeWeeks = Math.min(12, Math.max(4, Number(weeks) || 8));
    const startDate = new Date(`${start}T12:00:00`);
    if (Number.isNaN(startDate.getTime())) throw new Error('Fecha de inicio no válida.');
    const end = new Date(startDate);
    end.setDate(end.getDate() + safeWeeks * 7 - 1);
    return {
      id: 'evidence-upper-lower-4d-50', protocol: 'scientific-4d-50',
      goal: 'hypertrophy', days: 4, method: 'upperlower', minutes: 50,
      weeks: safeWeeks, start, end: end.toISOString().slice(0, 10),
      warmup: '5 min: movilidad específica y 2-3 series de aproximación del primer ejercicio.',
      progression: 'Mantén 1-3 RIR. Cuando completes el máximo de repeticiones en todas las series con técnica limpia, aumenta 2,5-5%. Descarga 5-10% si dos sesiones seguidas empeoran.',
      routine: clone(ROUTINE), references: REFERENCES
    };
  }

  function estimatedMinutes(day) {
    const list = ROUTINE[day] || [];
    const work = list.reduce((sum, item) => sum + item.sets * 0.55, 0);
    const rest = list.reduce((sum, item) => sum + Math.max(0, item.sets - 1) * item.rest / 60, 0);
    const transitions = Math.max(0, list.length - 1) * 0.75;
    return Math.ceil(5 + work + rest + transitions);
  }

  function install() {
    const method = document.getElementById('method');
    if (!method || method.querySelector('[value="evidence4"]')) return;
    const option = document.createElement('option');
    option.value = 'evidence4'; option.textContent = 'Científico 4 días · 50 min';
    method.prepend(option);
    const minutes = document.getElementById('minutes');
    if (minutes && !minutes.querySelector('[value="50"]')) {
      const minuteOption = document.createElement('option');
      minuteOption.value = '50'; minuteOption.textContent = '50'; minutes.append(minuteOption);
    }
    method.addEventListener('change', () => {
      if (method.value !== 'evidence4') return;
      document.getElementById('days').value = '4';
      if (minutes) minutes.value = '50';
    });
    document.getElementById('preview')?.addEventListener('click', () => {
      if (method.value !== 'evidence4') return;
      const plan = buildPlan({ start: document.getElementById('start').value, weeks: document.getElementById('weeks').value });
      const preview = document.getElementById('planPreview');
      preview.innerHTML = `<div class="card"><strong>Científico 4 días · 50 min</strong><div class="muted">Lunes a jueves · ${plan.weeks} semanas · 1-3 RIR · progresión doble</div><button id="activateEvidencePlan">Activar plan comprobado</button></div>` + Object.entries(plan.routine).map(([day, items]) => `<div class="card"><strong>${day} · ~${estimatedMinutes(day)} min</strong>${items.map(item => `<div class="planrow"><span>${item.name}</span><span>${item.sets}×${item.reps} · ${item.rest}s</span></div>`).join('')}</div>`).join('');
      document.getElementById('activateEvidencePlan').onclick = () => {
        localStorage.setItem('fitcoach_active_plan_v33', JSON.stringify(plan));
        // app.js mantiene su estado en memoria; recargar sincroniza Plan, Entrenar y Daily Coach.
        location.reload();
      };
    });
    const decorate = () => {
      const plan = (() => { try { return JSON.parse(localStorage.getItem('fitcoach_active_plan_v33')); } catch { return null; } })();
      if (plan?.protocol !== 'scientific-4d-50') return;
      const day = document.getElementById('trainingDay')?.value;
      const items = plan.routine?.[day] || [];
      document.querySelectorAll('#workout .exercise[data-ex]').forEach((box, index) => {
        const item = items[index]; if (!item || box.querySelector('.evidencePrescription')) return;
        const info = document.createElement('div'); info.className = 'notice evidencePrescription';
        info.textContent = `${item.sets}×${item.reps} · ${item.rir} RIR · descanso ${item.rest}s${item.note ? ' · ' + item.note : ''}`;
        box.querySelector('h3')?.after(info);
      });
      const guide = document.getElementById('weekGuide');
      const guideText = `${plan.warmup} ${plan.progression}`;
      if (guide && guide.textContent !== guideText) guide.textContent = guideText;
    };
    // Observa solo la lista de ejercicios. Observar todo body hacía que la propia
    // actualización de las instrucciones reactivase el observador indefinidamente.
    const workoutRoot = document.getElementById('workout');
    if (workoutRoot) new MutationObserver(decorate).observe(workoutRoot, { childList: true, subtree: true });
    decorate();
  }

  globalThis.FitCoachEvidencePlan = { buildPlan, estimatedMinutes, routine: clone(ROUTINE), references: REFERENCES };
  if (typeof document !== 'undefined') document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', install, { once: true }) : install();
})();
