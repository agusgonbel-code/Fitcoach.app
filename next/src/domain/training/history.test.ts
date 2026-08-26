import { describe, expect, it } from 'vitest';
import type { WorkoutSession } from '../models';
import { formatPreviousSet, historyForExercise, summarizeExerciseHistory } from './history';

const session = (id: string, completedAt: string, reps: number, rir: number | null, kg = 80): WorkoutSession => ({
  id,
  plannedWorkoutId: 'upper-a',
  localDate: completedAt.slice(0, 10),
  startedAt: completedAt,
  completedAt,
  exercises: [{
    exerciseId: 'bench',
    sets: [
      { kg, reps, rir, completedAt },
      { kg, reps, rir, completedAt },
      { kg, reps, rir, completedAt },
    ],
  }],
});

describe('exercise history', () => {
  it('sorts sessions chronologically and keeps the most recent three valid entries', () => {
    const sessions = [
      session('4', '2026-08-24T08:00:00Z', 10, 2),
      session('1', '2026-08-20T08:00:00Z', 7, 2),
      session('3', '2026-08-23T08:00:00Z', 9, 2),
      session('2', '2026-08-21T08:00:00Z', 8, 2),
    ];
    const history = historyForExercise(sessions, 'bench');
    expect(history).toHaveLength(3);
    expect(history.map((sets) => sets[0].reps)).toEqual([8, 9, 10]);
  });

  it('feeds real exercise history into the progression engine', () => {
    const summary = summarizeExerciseHistory({
      sessions: [
        session('1', '2026-08-20T08:00:00Z', 9, 2),
        session('2', '2026-08-22T08:00:00Z', 10, 2),
      ],
      exerciseId: 'bench',
      repsMin: 6,
      repsMax: 10,
      incrementKg: 2.5,
    });
    expect(summary.latestSets[0].reps).toBe(10);
    expect(summary.recommendation.action).toBe('increase');
    expect(summary.recommendation.suggestedKg).toBe(82.5);
  });

  it('preserves RIR zero and formats previous performance for the active workout', () => {
    const summary = summarizeExerciseHistory({
      sessions: [session('1', '2026-08-20T08:00:00Z', 8, 0)],
      exerciseId: 'bench',
      repsMin: 6,
      repsMax: 10,
    });
    expect(summary.latestSets[0].rir).toBe(0);
    expect(summary.recommendation.action).toBe('reduce');
    expect(formatPreviousSet(summary.latestSets[0])).toContain('RIR 0');
  });

  it('ignores empty and invalid exercise sets', () => {
    const invalid: WorkoutSession = {
      id: 'bad', plannedWorkoutId: 'upper-a', localDate: '2026-08-20', startedAt: '2026-08-20T08:00:00Z', completedAt: '2026-08-20T09:00:00Z',
      exercises: [{ exerciseId: 'bench', sets: [{ kg: 80, reps: 0, rir: 2, completedAt: '2026-08-20T08:10:00Z' }] }],
    };
    expect(historyForExercise([invalid], 'bench')).toEqual([]);
  });
});
