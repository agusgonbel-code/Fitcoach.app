import { describe, expect, it } from 'vitest';
import { validSession } from './localRepository';
import type { WorkoutSession } from '../domain/models';

const base = (): WorkoutSession => ({
  id: 's1', plannedWorkoutId: 'p1', localDate: '2026-08-26', startedAt: '2026-08-26T08:00:00', exercises: []
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
