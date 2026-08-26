import type { FoodLogEntry, NutritionTarget, UserProfile, WorkoutSession } from '../models';

export interface ProgressSummary {
  completedWorkouts7d: number;
  plannedWorkouts7d: number;
  trainingAdherence: number;
  totalSets7d: number;
  volumeLoad7d: number;
  averageRir7d: number | null;
  nutritionLoggingDays7d: number;
  nutritionAdherence: number | null;
}

const DAY_MS = 86_400_000;

function dayNumber(localDate: string) {
  const [year, month, day] = localDate.split('-').map(Number);
  return Date.UTC(year, month - 1, day) / DAY_MS;
}

function inLastSevenDays(localDate: string, today: string) {
  const delta = dayNumber(today) - dayNumber(localDate);
  return delta >= 0 && delta < 7;
}

export function summarizeProgress(
  profile: UserProfile,
  sessions: WorkoutSession[],
  foodLog: FoodLogEntry[],
  target: NutritionTarget,
  today: string,
): ProgressSummary {
  const recentSessions = sessions.filter((session) => session.completedAt && inLastSevenDays(session.localDate, today));
  const performedSets = recentSessions.flatMap((session) => session.exercises.flatMap((exercise) => exercise.sets));
  const validRir = performedSets.map((set) => set.rir).filter((rir): rir is number => Number.isFinite(rir));
  const recentFood = foodLog.filter((entry) => inLastSevenDays(entry.localDate, today));
  const foodByDay = new Map<string, number>();
  recentFood.forEach((entry) => foodByDay.set(entry.localDate, (foodByDay.get(entry.localDate) ?? 0) + entry.kcal));
  const loggedCalories = [...foodByDay.values()].filter((kcal) => kcal > 0);
  const nutritionAdherence = loggedCalories.length >= 4
    ? loggedCalories.reduce((sum, kcal) => sum + Math.max(0, 1 - Math.abs(kcal - target.kcal) / Math.max(1, target.kcal)), 0) / loggedCalories.length
    : null;

  return {
    completedWorkouts7d: recentSessions.length,
    plannedWorkouts7d: profile.trainingDaysPerWeek,
    trainingAdherence: Math.min(1, recentSessions.length / Math.max(1, profile.trainingDaysPerWeek)),
    totalSets7d: performedSets.length,
    volumeLoad7d: performedSets.reduce((sum, set) => sum + Math.max(0, set.kg) * Math.max(0, set.reps), 0),
    averageRir7d: validRir.length ? validRir.reduce((sum, rir) => sum + rir, 0) / validRir.length : null,
    nutritionLoggingDays7d: foodByDay.size,
    nutritionAdherence,
  };
}
