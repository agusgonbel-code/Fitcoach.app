(() => {
  'use strict';

  function parseRepRange(value) {
    const numbers = String(value ?? '').match(/\d+(?:[.,]\d+)?/g)?.map(item => Number(item.replace(',', '.'))) ?? [];
    if (!numbers.length) return null;
    const minimum = Math.max(1, Math.round(numbers[0]));
    const maximum = Math.max(minimum, Math.round(numbers[1] ?? numbers[0]));
    return { minimum, maximum };
  }

  function validSets(exercise) {
    return (Array.isArray(exercise?.sets) ? exercise.sets : []).map(set => {
      const kg = Number(set?.kg);
      const reps = Number(set?.reps);
      const rawRir = set?.rir;
      const rir = rawRir === '' || rawRir === null || rawRir === undefined ? null : Number(rawRir);
      if (!Number.isFinite(kg) || kg < 0 || !Number.isFinite(reps) || reps <= 0) return null;
      if (rir !== null && (!Number.isFinite(rir) || rir < 0 || rir > 10)) return null;
      return { kg, reps: Math.round(reps), rir };
    }).filter(Boolean);
  }

  function roundLoad(value, increment = 2.5) {
    const step = Number(increment);
    if (!Number.isFinite(value) || value < 0 || !Number.isFinite(step) || step <= 0) return null;
    return Math.round(value / step) * step;
  }

  function recommendProgression({ history = [], targetReps, increment = 2.5 } = {}) {
    const range = parseRepRange(targetReps);
    const sessions = (Array.isArray(history) ? history : []).map(exercise => ({
      exercise, sets: validSets(exercise)
    })).filter(session => session.sets.length);
    if (!range || !sessions.length) {
      return { action: 'record', tone: 'neutral', suggestedKg: null, text: 'Registra una sesión completa para calcular la progresión.' };
    }

    const latest = sessions.at(-1).sets;
    const previous = sessions.at(-2)?.sets ?? [];
    const load = Math.max(...latest.map(set => set.kg));
    const averageReps = latest.reduce((sum, set) => sum + set.reps, 0) / latest.length;
    const rirValues = latest.map(set => set.rir).filter(Number.isFinite);
    const averageRir = rirValues.length ? rirValues.reduce((sum, value) => sum + value, 0) / rirValues.length : null;
    const allAtTop = latest.every(set => set.reps >= range.maximum);
    const anyBelowMinimum = latest.some(set => set.reps < range.minimum);
    const previousAverage = previous.length
      ? previous.reduce((sum, set) => sum + set.reps, 0) / previous.length
      : null;
    const beforePrevious = sessions.at(-3)?.sets ?? [];
    const beforePreviousAverage = beforePrevious.length
      ? beforePrevious.reduce((sum, set) => sum + set.reps, 0) / beforePrevious.length
      : null;
    const repeatedDecline = beforePreviousAverage !== null && previousAverage !== null &&
      previousAverage + 0.5 < beforePreviousAverage && averageReps + 0.5 < previousAverage;

    if ((averageRir !== null && averageRir < 1) || (anyBelowMinimum && (averageRir === null || averageRir <= 2)) || repeatedDecline) {
      const suggestedKg = roundLoad(load * 0.95, increment);
      return {
        action: 'reduce', tone: 'amber', suggestedKg,
        text: `Reduce aproximadamente un 5% a ${suggestedKg} kg y recupera el rango con 1–3 RIR.`
      };
    }

    if (allAtTop && averageRir !== null && averageRir >= 1) {
      const suggestedKg = Math.max(roundLoad(load * 1.025, increment), roundLoad(load + increment, increment));
      return {
        action: 'increase', tone: 'green', suggestedKg,
        text: `Rango completado con RIR controlado: prueba ${suggestedKg} kg y vuelve al mínimo de repeticiones.`
      };
    }

    if (allAtTop && averageRir === null) {
      return {
        action: 'confirm-rir', tone: 'blue', suggestedKg: load,
        text: `Mantén ${load} kg y registra RIR antes de aumentar la carga.`
      };
    }

    return {
      action: 'add-reps', tone: 'blue', suggestedKg: load,
      text: `Mantén ${load} kg e intenta añadir una repetición total sin salir de 1–3 RIR.`
    };
  }

  globalThis.FitCoachProgression = { parseRepRange, validSets, roundLoad, recommendProgression };
})();
