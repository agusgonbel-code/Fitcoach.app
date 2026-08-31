import { describe, expect, it } from 'vitest';
import { adaptTraining } from './adaptTraining';
import { buildWeeklyTrainingAdaptation } from '../training/weeklyAdaptation';
import type { ProgressSummary } from '../progress/summarizeProgress';

const base: ProgressSummary = {
  completedWorkouts7d: 4,
  plannedWorkouts7d: 4,
  trainingAdherence: 1,
  totalSets7d: 20,
  volumeLoad7d: 12000,
  averageRir7d: 2,
  nutritionLoggingDays7d: 5,
  nutritionAdherence: 0.9,
};

describe('adaptTraining', () => {
  it.each([
    ['low adherence', { ...base, completedWorkouts7d: 1, trainingAdherence: 0.25 }],
    ['near-failure fatigue', { ...base, averageRir7d: 0.5 }],
    ['stable progression signal', { ...base, averageRir7d: 3 }],
    ['missing effort data', { ...base, averageRir7d: null }],
  ] as const)('uses the canonical weekly policy for %s', (_label, summary) => {
    expect(adaptTraining(summary)).toEqual(buildWeeklyTrainingAdaptation(summary));
  });

  it('keeps every coach adaptation explicitly user-confirmed', () => {
    expect(adaptTraining(base).requiresConfirmation).toBe(true);
  });
});
