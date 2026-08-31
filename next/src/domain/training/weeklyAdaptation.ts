import type { ProgressSummary } from '../progress/summarizeProgress';
import type { GeneratedWorkout } from './planGenerator';

export type AdaptationConfidence = 'low' | 'medium' | 'high';
export type AdaptationAction = 'maintain' | 'progress-load' | 'reduce-volume' | 'deload';

export interface WeeklyTrainingAdaptationProposal {
  id: string;
  action: AdaptationAction;
  volumePercent: number;
  loadPercent: number;
  deload: boolean;
  confidence: AdaptationConfidence;
  reasons: string[];
  requiresConfirmation: true;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Builds an explainable weekly proposal from recent user data.
 * This function is deliberately pure: it never mutates a plan, workout or history.
 * Applying a proposal must be a separate, explicit user action.
 */
export function buildWeeklyTrainingAdaptation(summary: ProgressSummary): WeeklyTrainingAdaptationProposal {
  const enoughTrainingData = summary.completedWorkouts7d >= 3 && summary.totalSets7d >= 8;

  if (summary.trainingAdherence < 0.6) {
    return {
      id: 'adapt-adherence', action: 'reduce-volume', volumePercent: -10, loadPercent: 0, deload: false,
      confidence: summary.completedWorkouts7d >= 2 ? 'high' : 'medium',
      reasons: [`Adherencia semanal del ${Math.round(summary.trainingAdherence * 100)}%.`, 'Conviene simplificar el plan antes de pedir más volumen o carga.'],
      requiresConfirmation: true,
    };
  }

  if (enoughTrainingData && summary.averageRir7d !== null && summary.averageRir7d <= 0.5) {
    return {
      id: 'adapt-fatigue', action: 'deload', volumePercent: -15, loadPercent: -5, deload: true, confidence: 'high',
      reasons: [`RIR medio ${summary.averageRir7d.toFixed(1)} con ${summary.totalSets7d} series recientes.`, 'La proximidad sostenida al fallo aumenta la probabilidad de fatiga acumulada.'],
      requiresConfirmation: true,
    };
  }

  if (enoughTrainingData && summary.averageRir7d !== null && summary.averageRir7d >= 2.5 && summary.trainingAdherence >= 0.75) {
    return {
      id: 'adapt-progress', action: 'progress-load', volumePercent: 0, loadPercent: 2.5, deload: false,
      confidence: summary.completedWorkouts7d >= summary.plannedWorkouts7d ? 'high' : 'medium',
      reasons: [`RIR medio ${summary.averageRir7d.toFixed(1)} con adherencia del ${Math.round(summary.trainingAdherence * 100)}%.`, 'Hay margen de esfuerzo y consistencia suficiente para una progresión conservadora de carga.'],
      requiresConfirmation: true,
    };
  }

  return {
    id: 'adapt-maintain', action: 'maintain', volumePercent: 0, loadPercent: 0, deload: false,
    confidence: enoughTrainingData ? 'high' : 'low',
    reasons: enoughTrainingData ? ['Los datos recientes no justifican modificar todavía volumen ni carga.'] : ['Se necesitan al menos 3 sesiones y 8 series válidas para proponer cambios de entrenamiento con confianza.'],
    requiresConfirmation: true,
  };
}

export function normalizeAdaptation(proposal: WeeklyTrainingAdaptationProposal): WeeklyTrainingAdaptationProposal {
  return { ...proposal, volumePercent: clamp(proposal.volumePercent, -25, 15), loadPercent: clamp(proposal.loadPercent, -10, 5), requiresConfirmation: true };
}

/** Returns the next Monday after the supplied local civil date. */
export function nextMicrocycleStart(localDate: string): string {
  const parsed = new Date(`${localDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) throw new Error('Fecha local no válida.');
  const mondayBased = (parsed.getDay() + 6) % 7;
  const daysUntilNextMonday = 7 - mondayBased;
  parsed.setDate(parsed.getDate() + daysUntilNextMonday);
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
}

/**
 * Applies only structural adaptations that the generated plan can represent safely.
 * Load adjustments stay explicit metadata because actual kg are derived from exercise history in Training.
 */
export function applyTrainingAdaptation(plan: GeneratedWorkout[], rawProposal: WeeklyTrainingAdaptationProposal): GeneratedWorkout[] {
  const proposal = normalizeAdaptation(rawProposal);
  if (proposal.action === 'maintain' || (proposal.volumePercent === 0 && !proposal.deload)) return plan.map(workout => ({ ...workout, exercises: workout.exercises.map(exercise => ({ ...exercise })) }));
  const factor = 1 + proposal.volumePercent / 100;
  return plan.map(workout => ({
    ...workout,
    exercises: workout.exercises.map(exercise => ({
      ...exercise,
      sets: Math.max(1, Math.round(exercise.sets * factor)),
      rirMin: proposal.deload ? Math.max(2, exercise.rirMin) : exercise.rirMin,
      rirMax: proposal.deload ? Math.max(3, exercise.rirMax) : exercise.rirMax,
    })),
  }));
}
