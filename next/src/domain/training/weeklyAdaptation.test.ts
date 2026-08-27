import { describe, expect, it } from 'vitest';
import type { ProgressSummary } from '../progress/summarizeProgress';
import { buildWeeklyTrainingAdaptation, normalizeAdaptation } from './weeklyAdaptation';

const base = (overrides: Partial<ProgressSummary> = {}): ProgressSummary => ({
  completedWorkouts7d: 4,
  plannedWorkouts7d: 4,
  trainingAdherence: 1,
  totalSets7d: 16,
  volumeLoad7d: 12000,
  averageRir7d: 2,
  nutritionLoggingDays7d: 5,
  nutritionAdherence: 0.9,
  ...overrides,
});

describe('buildWeeklyTrainingAdaptation', () => {
  it('reduces volume when adherence is too low instead of progressing load', () => {
    const proposal = buildWeeklyTrainingAdaptation(base({ completedWorkouts7d: 2, trainingAdherence: 0.5 }));
    expect(proposal.action).toBe('reduce-volume');
    expect(proposal.volumePercent).toBe(-10);
    expect(proposal.loadPercent).toBe(0);
    expect(proposal.requiresConfirmation).toBe(true);
  });

  it('proposes a deload when enough data shows sustained very low RIR', () => {
    const proposal = buildWeeklyTrainingAdaptation(base({ averageRir7d: 0.5 }));
    expect(proposal.action).toBe('deload');
    expect(proposal.deload).toBe(true);
    expect(proposal.volumePercent).toBe(-15);
    expect(proposal.loadPercent).toBe(-5);
    expect(proposal.confidence).toBe('high');
  });

  it('proposes only a conservative load increase when adherence and RIR support it', () => {
    const proposal = buildWeeklyTrainingAdaptation(base({ averageRir7d: 3 }));
    expect(proposal.action).toBe('progress-load');
    expect(proposal.volumePercent).toBe(0);
    expect(proposal.loadPercent).toBe(2.5);
    expect(proposal.requiresConfirmation).toBe(true);
  });

  it('maintains the plan when training data is insufficient', () => {
    const proposal = buildWeeklyTrainingAdaptation(base({ completedWorkouts7d: 1, totalSets7d: 4, averageRir7d: null }));
    expect(proposal.action).toBe('maintain');
    expect(proposal.confidence).toBe('low');
    expect(proposal.reasons[0]).toContain('3 sesiones');
  });

  it('never mutates the supplied summary', () => {
    const summary = Object.freeze(base({ averageRir7d: 3 }));
    expect(() => buildWeeklyTrainingAdaptation(summary)).not.toThrow();
    expect(summary.averageRir7d).toBe(3);
  });

  it('clamps externally reconstructed proposals to safe limits and keeps confirmation mandatory', () => {
    const normalized = normalizeAdaptation({
      id: 'unsafe-import', action: 'deload', volumePercent: -80, loadPercent: 30,
      deload: true, confidence: 'low', reasons: ['test'], requiresConfirmation: true,
    });
    expect(normalized.volumePercent).toBe(-25);
    expect(normalized.loadPercent).toBe(5);
    expect(normalized.requiresConfirmation).toBe(true);
  });
});
