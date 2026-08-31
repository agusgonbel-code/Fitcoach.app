import type { BodyMetric, FoodLogEntry, UserProfile, WorkoutSession } from '../domain/models';
import { migrateLegacyData, migrateLegacyProfile } from './legacyMigration';
import { LEGACY_MIGRATION_SUPPRESSION_KEY } from './privacyRepository';

const PROFILE_KEY = 'fitcoach_next_profile_v1';
const SESSIONS_KEY = 'fitcoach_next_sessions_v1';
const FOOD_LOG_KEY = 'fitcoach_next_food_log_v1';
const BODY_METRICS_KEY = 'fitcoach_next_body_metrics_v1';

const GOALS: UserProfile['goal'][] = ['hypertrophy', 'recomp', 'strength', 'fatloss', 'maintain'];
const EXPERIENCES: UserProfile['experience'][] = ['beginner', 'intermediate', 'advanced'];
const SEXES: UserProfile['sex'][] = ['male', 'female'];

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

function finiteInRange(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

function finiteOptionalInRange(value: unknown, min: number, max: number): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : undefined;
}

function stringsOnly(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  return [...new Set(value.filter((item): item is string => typeof item === 'string').map(item => item.trim()).filter(Boolean))];
}

function isValidCivilDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isValidTimestamp(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && Number.isFinite(Date.parse(value));
}

function legacyMigrationSuppressed(): boolean {
  return localStorage.getItem(LEGACY_MIGRATION_SUPPRESSION_KEY) === 'true';
}

function ensureLegacyActivityMigration(): void {
  if (legacyMigrationSuppressed()) return;
  migrateLegacyData(localStorage, () => crypto.randomUUID());
}

export function loadProfile(): UserProfile | null {
  let raw = readJson<Partial<UserProfile> | null>(PROFILE_KEY, null);
  if (!raw && !legacyMigrationSuppressed()) {
    migrateLegacyProfile(localStorage, () => crypto.randomUUID());
    raw = readJson<Partial<UserProfile> | null>(PROFILE_KEY, null);
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const preferredTrainingDays = Array.isArray(raw.preferredTrainingDays)
    ? [...new Set(raw.preferredTrainingDays.map(Number).filter(day => Number.isInteger(day) && day >= 0 && day <= 6))]
    : undefined;
  return {
    id: typeof raw.id === 'string' && raw.id.trim() ? raw.id : crypto.randomUUID(),
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : 'Atleta',
    goal: GOALS.includes(raw.goal as UserProfile['goal']) ? raw.goal as UserProfile['goal'] : 'recomp',
    experience: EXPERIENCES.includes(raw.experience as UserProfile['experience']) ? raw.experience as UserProfile['experience'] : 'intermediate',
    sex: SEXES.includes(raw.sex as UserProfile['sex']) ? raw.sex as UserProfile['sex'] : 'male',
    age: Math.round(finiteInRange(raw.age, 13, 100, 35)),
    heightCm: finiteInRange(raw.heightCm, 120, 230, 170),
    weightKg: finiteInRange(raw.weightKg, 30, 350, 70),
    bodyFatPct: finiteOptionalInRange(raw.bodyFatPct, 2, 70),
    activityMultiplier: finiteInRange(raw.activityMultiplier, 1.1, 2.5, 1.45),
    trainingDaysPerWeek: Math.round(finiteInRange(raw.trainingDaysPerWeek, 1, 7, 4)),
    sessionMinutes: Math.round(finiteInRange(raw.sessionMinutes, 15, 180, 50)),
    preferredTrainingDays,
    equipment: stringsOnly(raw.equipment, ['gym']),
    restrictions: stringsOnly(raw.restrictions, [])
  };
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function isStoredSet(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const set = value as { kg?: unknown; reps?: unknown; rir?: unknown; completedAt?: unknown };
  return typeof set.kg === 'number' && Number.isFinite(set.kg) && set.kg >= 0 &&
    typeof set.reps === 'number' && Number.isFinite(set.reps) && set.reps > 0 &&
    (set.rir === null || (typeof set.rir === 'number' && Number.isFinite(set.rir) && set.rir >= 0 && set.rir <= 10)) &&
    isValidTimestamp(set.completedAt);
}

function isStoredSession(value: unknown): value is WorkoutSession {
  if (!value || typeof value !== 'object') return false;
  const session = value as Partial<WorkoutSession>;
  return typeof session.id === 'string' && session.id.trim().length > 0 &&
    typeof session.plannedWorkoutId === 'string' && session.plannedWorkoutId.trim().length > 0 &&
    isValidCivilDate(session.localDate) &&
    isValidTimestamp(session.startedAt) &&
    (session.completedAt === undefined || isValidTimestamp(session.completedAt)) &&
    (session.notes === undefined || typeof session.notes === 'string') &&
    Array.isArray(session.exercises) && session.exercises.every(exercise =>
      Boolean(exercise && typeof exercise === 'object' && typeof exercise.exerciseId === 'string' && exercise.exerciseId.trim().length > 0 &&
        Array.isArray(exercise.sets) && exercise.sets.every(isStoredSet))
    );
}

export function loadSessions(): WorkoutSession[] {
  ensureLegacyActivityMigration();
  const stored = readJson<unknown>(SESSIONS_KEY, []);
  return Array.isArray(stored) ? stored.filter(isStoredSession) : [];
}

export function validSession(session: WorkoutSession): boolean {
  return isStoredSession(session) && session.exercises.some(exercise => exercise.sets.length > 0);
}

export function saveSession(session: WorkoutSession): void {
  if (!validSession(session)) throw new Error('La sesión necesita al menos una serie válida.');
  const sessions = loadSessions();
  localStorage.setItem(SESSIONS_KEY, JSON.stringify([...sessions.filter(item => item.id !== session.id), session]));
}

function isStoredFoodEntry(value: unknown): value is FoodLogEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<FoodLogEntry>;
  return typeof entry.id === 'string' && entry.id.trim().length > 0 &&
    isValidCivilDate(entry.localDate) &&
    typeof entry.name === 'string' && entry.name.trim().length > 0 &&
    [entry.kcal, entry.proteinG, entry.carbsG, entry.fatG].every(value => typeof value === 'number' && Number.isFinite(value) && value >= 0) &&
    Number(entry.kcal) > 0 &&
    isValidTimestamp(entry.createdAt);
}

export function loadFoodLog(): FoodLogEntry[] {
  ensureLegacyActivityMigration();
  const stored = readJson<unknown>(FOOD_LOG_KEY, []);
  return Array.isArray(stored) ? stored.filter(isStoredFoodEntry) : [];
}

export function validFoodEntry(entry: FoodLogEntry): boolean {
  return isStoredFoodEntry(entry);
}

export function saveFoodEntry(entry: FoodLogEntry): void {
  if (!validFoodEntry(entry)) throw new Error('Completa una comida válida antes de guardarla.');
  const log = loadFoodLog();
  localStorage.setItem(FOOD_LOG_KEY, JSON.stringify([...log.filter(item => item.id !== entry.id), entry]));
}

export function removeFoodEntry(id: string): void {
  localStorage.setItem(FOOD_LOG_KEY, JSON.stringify(loadFoodLog().filter(item => item.id !== id)));
}

export function loadBodyMetrics(): BodyMetric[] {
  return readJson<BodyMetric[]>(BODY_METRICS_KEY, [])
    .filter(validBodyMetric)
    .sort((a, b) => a.localDate.localeCompare(b.localDate) || a.createdAt.localeCompare(b.createdAt));
}

export function validBodyMetric(metric: BodyMetric): boolean {
  const validWeight = Number.isFinite(metric.weightKg) && metric.weightKg >= 30 && metric.weightKg <= 350;
  const validWaist = metric.waistCm === undefined || (Number.isFinite(metric.waistCm) && metric.waistCm >= 40 && metric.waistCm <= 250);
  const validBodyFat = metric.bodyFatPct === undefined || (Number.isFinite(metric.bodyFatPct) && metric.bodyFatPct >= 2 && metric.bodyFatPct <= 70);
  return Boolean(typeof metric.id === 'string' && metric.id.trim() && isValidCivilDate(metric.localDate) && isValidTimestamp(metric.createdAt) && validWeight && validWaist && validBodyFat);
}

export function saveBodyMetric(metric: BodyMetric): void {
  if (!validBodyMetric(metric)) throw new Error('Revisa el peso y las medidas antes de guardar.');
  const metrics = loadBodyMetrics();
  const next = [...metrics.filter(item => item.id !== metric.id), metric]
    .sort((a, b) => a.localDate.localeCompare(b.localDate) || a.createdAt.localeCompare(b.createdAt));
  localStorage.setItem(BODY_METRICS_KEY, JSON.stringify(next));
}

export function removeBodyMetric(id: string): void {
  localStorage.setItem(BODY_METRICS_KEY, JSON.stringify(loadBodyMetrics().filter(item => item.id !== id)));
}