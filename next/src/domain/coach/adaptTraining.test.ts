import { describe, expect, it } from 'vitest';
import { adaptTraining } from './adaptTraining';
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
  it('prioritizes adherence recovery before overload', () => {
    const result = adaptTraining({ ...base, completedWorkouts7d: 1, trainingAdherence: 0.25 });
    expect(result.action).toBe('rebuild-adherence');
    expect(result.volumeMultiplier).toBe(0.85);
    expect(result.loadChangePct).toBe(0);
  });

  it('reduces volume after repeated near-failure effort', () => {
    const result = adaptTraining({ ...base, averageRir7d: 0.5 });
    expect(result.action).toBe('reduce-volume');
    expect(result.volumeMultiplier).toBe(0.8);
  });

  it('uses a conservative load increase when adherence and RIR are stable', () => {
    const result = adaptTraining(base);
    expect(result.action).toBe('progress-load');
    expect(result.loadChangePct).toBe(2.5);
    expect(result.volumeMultiplier).toBe(1);
  });

  it('holds prescription when effort data are missing', () => {
    const result = adaptTraining({ ...base, averageRir7d: null });
    expect(result.action).toBe('hold');
    expect(result.confidence).toBe('low');
  });
});
