import type { PerformedSet } from '../models';

export type ProgressionAction = 'record' | 'reduce' | 'increase' | 'confirm-rir' | 'add-reps';

export interface ProgressionRecommendation {
  action: ProgressionAction;
  suggestedKg: number | null;
  message: string;
}

export interface ProgressionInput {
  history: PerformedSet[][];
  repsMin: number;
  repsMax: number;
  incrementKg?: number;
}

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const roundLoad = (value: number, increment: number) => Math.round(value / increment) * increment;

export function recommendProgression({
  history,
  repsMin,
  repsMax,
  incrementKg = 2.5,
}: ProgressionInput): ProgressionRecommendation {
  const sessions = history.filter((sets) => sets.length > 0);
  if (!sessions.length || repsMin < 1 || repsMax < repsMin) {
    return { action: 'record', suggestedKg: null, message: 'Registra una sesión completa para calcular la progresión.' };
  }

  const latest = sessions.at(-1)!;
  const previous = sessions.at(-2);
  const beforePrevious = sessions.at(-3);
  const load = Math.max(...latest.map((set) => set.kg));
  const avgReps = average(latest.map((set) => set.reps));
  const rirValues = latest.map((set) => set.rir).filter((value): value is number => value !== null);
  const avgRir = rirValues.length ? average(rirValues) : null;
  const allAtTop = latest.every((set) => set.reps >= repsMax);
  const anyBelowMinimum = latest.some((set) => set.reps < repsMin);

  const previousAvg = previous?.length ? average(previous.map((set) => set.reps)) : null;
  const beforePreviousAvg = beforePrevious?.length ? average(beforePrevious.map((set) => set.reps)) : null;
  const repeatedDecline = previousAvg !== null && beforePreviousAvg !== null &&
    previousAvg + 0.5 < beforePreviousAvg && avgReps + 0.5 < previousAvg;

  if ((avgRir !== null && avgRir < 1) || (anyBelowMinimum && (avgRir === null || avgRir <= 2)) || repeatedDecline) {
    const suggestedKg = roundLoad(load * 0.95, incrementKg);
    return { action: 'reduce', suggestedKg, message: `Reduce aproximadamente un 5% a ${suggestedKg} kg y recupera el rango con 1–3 RIR.` };
  }

  if (allAtTop && avgRir !== null && avgRir >= 1) {
    const suggestedKg = Math.max(roundLoad(load * 1.025, incrementKg), roundLoad(load + incrementKg, incrementKg));
    return { action: 'increase', suggestedKg, message: `Rango completado con RIR controlado: prueba ${suggestedKg} kg y vuelve al mínimo de repeticiones.` };
  }

  if (allAtTop && avgRir === null) {
    return { action: 'confirm-rir', suggestedKg: load, message: `Mantén ${load} kg y registra RIR antes de aumentar la carga.` };
  }

  return { action: 'add-reps', suggestedKg: load, message: `Mantén ${load} kg e intenta añadir una repetición total sin salir de 1–3 RIR.` };
}
