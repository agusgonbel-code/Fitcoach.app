import type { FoodLogEntry, Goal, Sex, UserProfile, WorkoutSession } from '../domain/models';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

const NEXT_PROFILE_KEY = 'fitcoach_next_profile_v1';
const NEXT_SESSIONS_KEY = 'fitcoach_next_sessions_v1';
const NEXT_FOOD_LOG_KEY = 'fitcoach_next_food_log_v1';
const LEGACY_DATA_MARKER = 'fitcoach_next_legacy_data_migration_v1';
const LEGACY_CLIENT_KEY = 'fitcoach_client_profile_v35';
const LEGACY_NUTRITION_KEY = 'fitcoach_nutrition_profile_v34';
const LEGACY_WORKOUTS_KEY = 'workouts';
const LEGACY_MEALS_KEY = 'meals';

export interface LegacyMigrationResult {
  migrated: boolean;
  source: 'client-v35' | 'nutrition-v34' | 'none';
  profile: UserProfile | null;
  reason?: 'next-profile-exists' | 'no-valid-legacy-profile';
}

export interface LegacyDataMigrationResult {
  migrated: boolean;
  workouts: number;
  meals: number;
  reason?: 'already-migrated';
}

function parseObject(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function parseArray(raw: string | null): unknown[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function finiteNumber(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function isValidCivilDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isValidTimestamp(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && Number.isFinite(Date.parse(value));
}

function localDateFrom(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return isValidCivilDate(value) ? value : null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const localDate = `${y}-${m}-${d}`;
  return isValidCivilDate(localDate) ? localDate : null;
}

function mapGoal(value: unknown): Goal {
  switch (String(value || '').toLowerCase()) {
    case 'loss':
    case 'fatloss': return 'fatloss';
    case 'gain':
    case 'hypertrophy': return 'hypertrophy';
    case 'strength': return 'strength';
    case 'maintain': return 'maintain';
    default: return 'recomp';
  }
}

function mapSex(value: unknown): Sex {
  return String(value || '').toLowerCase() === 'f' || String(value || '').toLowerCase() === 'female' ? 'female' : 'male';
}

function textRestrictions(...values: unknown[]): string[] {
  return values
    .flatMap(value => String(value || '').split(/[\n;,]+/))
    .map(value => value.trim())
    .filter(Boolean);
}

export function mapLegacyProfile(raw: Record<string, unknown>, id: string): UserProfile | null {
  const age = finiteNumber(raw.age);
  const heightCm = finiteNumber(raw.height ?? raw.heightCm);
  const weightKg = finiteNumber(raw.weight ?? raw.weightKg);
  if (!age || age < 14 || age > 100 || !heightCm || heightCm < 120 || heightCm > 230 || !weightKg || weightKg < 35 || weightKg > 350) {
    return null;
  }

  const days = finiteNumber(raw.days ?? raw.trainingDaysPerWeek) ?? 4;
  const minutes = finiteNumber(raw.minutes ?? raw.sessionMinutes) ?? 50;
  const activity = finiteNumber(raw.activity ?? raw.activityMultiplier) ?? 1.45;
  const bodyFat = finiteNumber(raw.bodyFat ?? raw.bodyFatPct);
  const experience = ['beginner', 'intermediate', 'advanced'].includes(String(raw.experience))
    ? String(raw.experience) as UserProfile['experience']
    : 'intermediate';

  return {
    id,
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : 'Atleta',
    goal: mapGoal(raw.goal),
    experience,
    sex: mapSex(raw.sex),
    age: Math.round(age),
    heightCm,
    weightKg,
    bodyFatPct: bodyFat && bodyFat >= 3 && bodyFat <= 70 ? bodyFat : undefined,
    activityMultiplier: Math.min(2.2, Math.max(1.1, activity)),
    trainingDaysPerWeek: Math.min(6, Math.max(2, Math.round(days))),
    sessionMinutes: Math.min(120, Math.max(20, Math.round(minutes))),
    equipment: Array.isArray(raw.equipment) ? raw.equipment.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [],
    restrictions: textRestrictions(raw.limitations, raw.conditions, raw.contraindications)
  };
}

export function migrateLegacyProfile(storage: StorageLike, createId: () => string): LegacyMigrationResult {
  if (parseObject(storage.getItem(NEXT_PROFILE_KEY))) {
    return { migrated: false, source: 'none', profile: null, reason: 'next-profile-exists' };
  }

  const client = parseObject(storage.getItem(LEGACY_CLIENT_KEY));
  const nutrition = parseObject(storage.getItem(LEGACY_NUTRITION_KEY));
  const candidates: Array<{ source: LegacyMigrationResult['source']; raw: Record<string, unknown> | null }> = [
    { source: 'client-v35', raw: client },
    { source: 'nutrition-v34', raw: nutrition }
  ];

  for (const candidate of candidates) {
    if (!candidate.raw) continue;
    const profile = mapLegacyProfile(candidate.raw, createId());
    if (!profile) continue;
    storage.setItem(NEXT_PROFILE_KEY, JSON.stringify(profile));
    return { migrated: true, source: candidate.source, profile };
  }

  return { migrated: false, source: 'none', profile: null, reason: 'no-valid-legacy-profile' };
}

function mapLegacyWorkout(value: unknown, createId: () => string): WorkoutSession | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const localDate = localDateFrom(raw.date);
  if (!localDate || !Array.isArray(raw.exercises)) return null;
  const timestamp = isValidTimestamp(raw.date) ? raw.date : `${localDate}T12:00:00`;

  const exercises = raw.exercises.flatMap(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const exercise = item as Record<string, unknown>;
    const name = typeof exercise.name === 'string' ? exercise.name.trim() : '';
    if (!name || !Array.isArray(exercise.sets)) return [];
    const sets = exercise.sets.flatMap(setValue => {
      if (!setValue || typeof setValue !== 'object' || Array.isArray(setValue)) return [];
      const set = setValue as Record<string, unknown>;
      const kg = finiteNumber(set.kg);
      const reps = finiteNumber(set.reps);
      const roundedReps = reps === null ? null : Math.round(reps);
      const rirRaw = set.rir;
      const rir = rirRaw === '' || rirRaw === null || rirRaw === undefined ? null : finiteNumber(rirRaw);
      if (kg === null || kg < 0 || roundedReps === null || roundedReps <= 0 || (rir !== null && (rir < 0 || rir > 10))) return [];
      return [{ kg, reps: roundedReps, rir, completedAt: timestamp }];
    });
    return sets.length ? [{ exerciseId: `legacy:${name}`, sets }] : [];
  });
  if (!exercises.length) return null;
  return {
    id: `legacy-workout-${createId()}`,
    plannedWorkoutId: `legacy:${typeof raw.day === 'string' && raw.day.trim() ? raw.day.trim() : 'workout'}`,
    localDate,
    startedAt: timestamp,
    completedAt: timestamp,
    exercises,
    notes: typeof raw.notes === 'string' && raw.notes.trim() ? raw.notes.trim() : undefined
  };
}

function mapLegacyMeal(value: unknown, createId: () => string): FoodLogEntry | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const localDate = localDateFrom(raw.date);
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  const kcal = finiteNumber(raw.kcal);
  const protein = finiteNumber(raw.protein);
  const carbs = finiteNumber(raw.carbs ?? raw.c);
  const fat = finiteNumber(raw.fat ?? raw.f);
  if (!localDate || !name || kcal === null || kcal <= 0 || protein === null || protein < 0) return null;
  return {
    id: `legacy-meal-${createId()}`,
    localDate,
    name,
    kcal,
    proteinG: protein,
    carbsG: carbs !== null && carbs >= 0 ? carbs : 0,
    fatG: fat !== null && fat >= 0 ? fat : 0,
    createdAt: isValidTimestamp(raw.createdAt) ? raw.createdAt : `${localDate}T12:00:00`
  };
}

export function migrateLegacyData(storage: StorageLike, createId: () => string): LegacyDataMigrationResult {
  if (storage.getItem(LEGACY_DATA_MARKER) === 'done') {
    return { migrated: false, workouts: 0, meals: 0, reason: 'already-migrated' };
  }

  const existingSessions = parseArray(storage.getItem(NEXT_SESSIONS_KEY)) as WorkoutSession[];
  const existingMeals = parseArray(storage.getItem(NEXT_FOOD_LOG_KEY)) as FoodLogEntry[];
  const migratedSessions = parseArray(storage.getItem(LEGACY_WORKOUTS_KEY)).flatMap(value => {
    const session = mapLegacyWorkout(value, createId);
    return session ? [session] : [];
  });
  const migratedMeals = parseArray(storage.getItem(LEGACY_MEALS_KEY)).flatMap(value => {
    const meal = mapLegacyMeal(value, createId);
    return meal ? [meal] : [];
  });

  if (migratedSessions.length) storage.setItem(NEXT_SESSIONS_KEY, JSON.stringify([...existingSessions, ...migratedSessions]));
  if (migratedMeals.length) storage.setItem(NEXT_FOOD_LOG_KEY, JSON.stringify([...existingMeals, ...migratedMeals]));
  storage.setItem(LEGACY_DATA_MARKER, 'done');
  return { migrated: migratedSessions.length > 0 || migratedMeals.length > 0, workouts: migratedSessions.length, meals: migratedMeals.length };
}
