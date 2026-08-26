import type { PerformedSet, WorkoutSession } from '../models';
import { recommendProgression, type ProgressionRecommendation } from './progression';

export interface ExerciseHistorySummary {
  exerciseId: string;
  sessions: PerformedSet[][];
  latestSets: PerformedSet[];
  recommendation: ProgressionRecommendation;
}

function validSets(sets: PerformedSet[]): PerformedSet[] {
  return sets.filter((set) =>
    Number.isFinite(set.kg) && set.kg >= 0 &&
    Number.isFinite(set.reps) && set.reps > 0 &&
    (set.rir === null || (Number.isFinite(set.rir) && set.rir >= 0 && set.rir <= 10))
  );
}

export function historyForExercise(
  sessions: WorkoutSession[],
  exerciseId: string,
  limit = 3,
): PerformedSet[][] {
  const safeLimit = Math.max(1, Math.floor(limit));
  return sessions
    .filter((session) => Boolean(session.completedAt))
    .sort((a, b) => new Date(a.completedAt ?? a.startedAt).getTime() - new Date(b.completedAt ?? b.startedAt).getTime())
    .map((session) => session.exercises.find((exercise) => exercise.exerciseId === exerciseId)?.sets ?? [])
    .map(validSets)
    .filter((sets) => sets.length > 0)
    .slice(-safeLimit);
}

export function summarizeExerciseHistory({
  sessions,
  exerciseId,
  repsMin,
  repsMax,
  incrementKg = 2.5,
}: {
  sessions: WorkoutSession[];
  exerciseId: string;
  repsMin: number;
  repsMax: number;
  incrementKg?: number;
}): ExerciseHistorySummary {
  const history = historyForExercise(sessions, exerciseId, 3);
  return {
    exerciseId,
    sessions: history,
    latestSets: history.at(-1) ?? [],
    recommendation: recommendProgression({ history, repsMin, repsMax, incrementKg }),
  };
}

export function formatPreviousSet(set: PerformedSet | undefined): string {
  if (!set) return '—';
  const rir = set.rir === null ? '' : ` · RIR ${set.rir}`;
  return `${set.kg} kg × ${set.reps}${rir}`;
}
