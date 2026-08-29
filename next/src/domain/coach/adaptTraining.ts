import type { ProgressSummary } from '../progress/summarizeProgress';

export type TrainingAdaptationAction =
  | 'hold'
  | 'reduce-volume'
  | 'progress-load'
  | 'rebuild-adherence';

export interface TrainingAdaptation {
  action: TrainingAdaptationAction;
  volumeMultiplier: number;
  loadChangePct: number;
  reason: string;
  confidence: 'low' | 'medium' | 'high';
}

/**
 * Conservative, deterministic training adaptation for the next microcycle.
 * It deliberately avoids changing load/volume when the available signal is weak.
 */
export function adaptTraining(summary: ProgressSummary): TrainingAdaptation {
  const adherence = summary.trainingAdherence;
  const averageRir = summary.averageRir7d;

  if (adherence < 0.5) {
    return {
      action: 'rebuild-adherence',
      volumeMultiplier: 0.85,
      loadChangePct: 0,
      reason: 'Training adherence is below 50%; reduce session demand before adding overload.',
      confidence: summary.plannedWorkouts7d >= 3 ? 'high' : 'medium',
    };
  }

  if (averageRir !== null && averageRir < 1) {
    return {
      action: 'reduce-volume',
      volumeMultiplier: 0.8,
      loadChangePct: 0,
      reason: 'Average effort is repeatedly near failure; lower volume to protect recovery.',
      confidence: summary.completedWorkouts7d >= 3 ? 'high' : 'medium',
    };
  }

  if (
    adherence >= 0.85 &&
    averageRir !== null &&
    averageRir >= 2 &&
    averageRir <= 4 &&
    summary.completedWorkouts7d >= 3
  ) {
    return {
      action: 'progress-load',
      volumeMultiplier: 1,
      loadChangePct: 2.5,
      reason: 'Adherence and effort are stable; a small load increase is appropriate for the next exposure.',
      confidence: 'high',
    };
  }

  return {
    action: 'hold',
    volumeMultiplier: 1,
    loadChangePct: 0,
    reason: 'Current data do not justify a training change; preserve the prescription and collect another week.',
    confidence: averageRir === null ? 'low' : 'medium',
  };
}
