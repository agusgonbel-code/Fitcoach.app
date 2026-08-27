import type { ProgressSummary } from '../progress/summarizeProgress';

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
      id: 'adapt-adherence',
      action: 'reduce-volume',
      volumePercent: -10,
      loadPercent: 0,
      deload: false,
      confidence: summary.completedWorkouts7d >= 2 ? 'high' : 'medium',
      reasons: [
        `Adherencia semanal del ${Math.round(summary.trainingAdherence * 100)}%.`,
        'Conviene simplificar el plan antes de pedir más volumen o carga.',
      ],
      requiresConfirmation: true,
    };
  }

  if (enoughTrainingData && summary.averageRir7d !== null && summary.averageRir7d <= 0.5) {
    return {
      id: 'adapt-fatigue',
      action: 'deload',
      volumePercent: -15,
      loadPercent: -5,
      deload: true,
      confidence: 'high',
      reasons: [
        `RIR medio ${summary.averageRir7d.toFixed(1)} con ${summary.totalSets7d} series recientes.`,
        'La proximidad sostenida al fallo aumenta la probabilidad de fatiga acumulada.',
      ],
      requiresConfirmation: true,
    };
  }

  if (enoughTrainingData && summary.averageRir7d !== null && summary.averageRir7d >= 2.5 && summary.trainingAdherence >= 0.75) {
    return {
      id: 'adapt-progress',
      action: 'progress-load',
      volumePercent: 0,
      loadPercent: 2.5,
      deload: false,
      confidence: summary.completedWorkouts7d >= summary.plannedWorkouts7d ? 'high' : 'medium',
      reasons: [
        `RIR medio ${summary.averageRir7d.toFixed(1)} con adherencia del ${Math.round(summary.trainingAdherence * 100)}%.`,
        'Hay margen de esfuerzo y consistencia suficiente para una progresión conservadora de carga.',
      ],
      requiresConfirmation: true,
    };
  }

  return {
    id: 'adapt-maintain',
    action: 'maintain',
    volumePercent: 0,
    loadPercent: 0,
    deload: false,
    confidence: enoughTrainingData ? 'high' : 'low',
    reasons: enoughTrainingData
      ? ['Los datos recientes no justifican modificar todavía volumen ni carga.']
      : ['Se necesitan al menos 3 sesiones y 8 series válidas para proponer cambios de entrenamiento con confianza.'],
    requiresConfirmation: true,
  };
}

export function normalizeAdaptation(proposal: WeeklyTrainingAdaptationProposal): WeeklyTrainingAdaptationProposal {
  return {
    ...proposal,
    volumePercent: clamp(proposal.volumePercent, -25, 15),
    loadPercent: clamp(proposal.loadPercent, -10, 5),
    requiresConfirmation: true,
  };
}
