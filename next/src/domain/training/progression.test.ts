import { describe, expect, it } from 'vitest';
import { recommendProgression } from './progression';
import type { PerformedSet } from '../models';

const set = (kg: number, reps: number, rir: number | null): PerformedSet => ({
  kg,
  reps,
  rir,
  completedAt: '2026-08-26T08:00:00+02:00',
});

describe('recommendProgression', () => {
  it('asks for data when there is no valid session', () => {
    expect(recommendProgression({ history: [], repsMin: 6, repsMax: 10 }).action).toBe('record');
  });

  it('adds load only after reaching the top of the range with controlled RIR', () => {
    const result = recommendProgression({
      history: [[set(80, 10, 2), set(80, 10, 2), set(80, 10, 1)]],
      repsMin: 6,
      repsMax: 10,
      incrementKg: 2.5,
    });
    expect(result.action).toBe('increase');
    expect(result.suggestedKg).toBe(82.5);
  });

  it('preserves RIR 0 as valid data and recommends reducing fatigue', () => {
    const result = recommendProgression({
      history: [[set(80, 8, 0), set(80, 7, 0)]],
      repsMin: 6,
      repsMax: 10,
    });
    expect(result.action).toBe('reduce');
  });

  it('keeps load and asks for more reps when progression is incomplete', () => {
    const result = recommendProgression({
      history: [[set(80, 9, 2), set(80, 8, 2)]],
      repsMin: 6,
      repsMax: 10,
    });
    expect(result.action).toBe('add-reps');
    expect(result.suggestedKg).toBe(80);
  });
});
