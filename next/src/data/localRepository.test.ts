import { describe, expect, it } from 'vitest';
import { validBodyMetric, validSession } from './localRepository';
import type { BodyMetric, WorkoutSession } from '../domain/models';

const base = (): WorkoutSession => ({
  id: 's1', plannedWorkoutId: 'p1', localDate: '2026-08-26', startedAt: '2026-08-26T08:00:00', exercises: []
});

const metric = (overrides: Partial<BodyMetric> = {}): BodyMetric => ({
  id: 'm1',
  localDate: '2026-08-27',
  weightKg: 80.5,
  waistCm: 84,
  bodyFatPct: 18,
  createdAt: '2026-08-27T08:00:00.000Z',
  ...overrides,
});

describe('validSession', () => {
  it('rejects an empty session', () => {
    expect(validSession(base())).toBe(false);
  });

  it('preserves RIR 0 as a valid value', () => {
    const session = base();
    session.exercises = [{ exerciseId: 'bench', sets: [{ kg: 80, reps: 8, rir: 0, completedAt: '2026-08-26T08:05:00' }] }];
    expect(validSession(session)).toBe(true);
  });

  it('rejects invalid repetitions', () => {
    const session = base();
    session.exercises = [{ exerciseId: 'bench', sets: [{ kg: 80, reps: 0, rir: 2, completedAt: '2026-08-26T08:05:00' }] }];
    expect(validSession(session)).toBe(false);
  });
});

describe('validBodyMetric', () => {
  it('accepts weight with optional waist and body-fat measurements', () => {
    expect(validBodyMetric(metric())).toBe(true);
    expect(validBodyMetric(metric({ waistCm: undefined, bodyFatPct: undefined }))).toBe(true);
  });

  it('rejects impossible weight, waist and body-fat values', () => {
    expect(validBodyMetric(metric({ weightKg: 10 }))).toBe(false);
    expect(validBodyMetric(metric({ waistCm: 20 }))).toBe(false);
    expect(validBodyMetric(metric({ bodyFatPct: 90 }))).toBe(false);
  });

  it('requires a stable local civil date', () => {
    expect(validBodyMetric(metric({ localDate: '27/08/2026' }))).toBe(false);
  });
});
