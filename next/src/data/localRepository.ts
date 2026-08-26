import type { FoodLogEntry, UserProfile, WorkoutSession } from '../domain/models';
import { migrateLegacyProfile } from './legacyMigration';

const PROFILE_KEY = 'fitcoach_next_profile_v1';
const SESSIONS_KEY = 'fitcoach_next_sessions_v1';
const FOOD_LOG_KEY = 'fitcoach_next_food_log_v1';

export function localDate(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

export function loadProfile(): UserProfile | null {
  let raw = readJson<Partial<UserProfile> | null>(PROFILE_KEY, null);
  if (!raw) {
    migrateLegacyProfile(localStorage, () => crypto.randomUUID());
    raw = readJson<Partial<UserProfile> | null>(PROFILE_KEY, null);
  }
  if (!raw) return null;
  const migrated: UserProfile = {
    id: raw.id || crypto.randomUUID(),
    name: raw.name || 'Atleta',
    goal: raw.goal || 'recomp',
    experience: raw.experience || 'intermediate',
    sex: raw.sex || 'male',
    age: Number(raw.age) || 35,
    heightCm: Number(raw.heightCm) || 170,
    weightKg: Number(raw.weightKg) || 70,
    bodyFatPct: raw.bodyFatPct,
    activityMultiplier: Number(raw.activityMultiplier) || 1.45,
    trainingDaysPerWeek: Number(raw.trainingDaysPerWeek) || 4,
    sessionMinutes: Number(raw.sessionMinutes) || 50,
    equipment: Array.isArray(raw.equipment) ? raw.equipment : ['gym'],
    restrictions: Array.isArray(raw.restrictions) ? raw.restrictions : []
  };
  return migrated;
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadSessions(): WorkoutSession[] {
  return readJson<WorkoutSession[]>(SESSIONS_KEY, []);
}

export function validSession(session: WorkoutSession): boolean {
  return session.exercises.some(exercise => exercise.sets.some(set =>
    Number.isFinite(set.kg) && set.kg >= 0 &&
    Number.isFinite(set.reps) && set.reps > 0 &&
    (set.rir === null || (Number.isFinite(set.rir) && set.rir >= 0 && set.rir <= 10))
  ));
}

export function saveSession(session: WorkoutSession): void {
  if (!validSession(session)) throw new Error('La sesión necesita al menos una serie válida.');
  const sessions = loadSessions();
  const next = [...sessions.filter(item => item.id !== session.id), session];
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(next));
}

export function loadFoodLog(): FoodLogEntry[] {
  return readJson<FoodLogEntry[]>(FOOD_LOG_KEY, []);
}

export function validFoodEntry(entry: FoodLogEntry): boolean {
  return entry.name.trim().length > 0 &&
    [entry.kcal, entry.proteinG, entry.carbsG, entry.fatG].every(value => Number.isFinite(value) && value >= 0) &&
    entry.kcal > 0;
}

export function saveFoodEntry(entry: FoodLogEntry): void {
  if (!validFoodEntry(entry)) throw new Error('Completa una comida válida antes de guardarla.');
  const log = loadFoodLog();
  localStorage.setItem(FOOD_LOG_KEY, JSON.stringify([...log.filter(item => item.id !== entry.id), entry]));
}

export function removeFoodEntry(id: string): void {
  localStorage.setItem(FOOD_LOG_KEY, JSON.stringify(loadFoodLog().filter(item => item.id !== id)));
}
