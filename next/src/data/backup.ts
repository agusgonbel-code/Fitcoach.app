import type { BodyMetric, FoodLogEntry, UserProfile, WorkoutSession } from '../domain/models';
import { validBodyMetric, validFoodEntry, validSession } from './localRepository';

export const BACKUP_VERSION = 1 as const;

const KEYS = {
  profile: 'fitcoach_next_profile_v1',
  sessions: 'fitcoach_next_sessions_v1',
  foodLog: 'fitcoach_next_food_log_v1',
  bodyMetrics: 'fitcoach_next_body_metrics_v1'
} as const;

export interface FitCoachBackupV1 {
  schema: 'fitcoach-next-backup';
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  data: {
    profile: UserProfile | null;
    sessions: WorkoutSession[];
    foodLog: FoodLogEntry[];
    bodyMetrics: BodyMetric[];
  };
}

function parse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function validProfile(profile: UserProfile | null): boolean {
  if (profile === null) return true;
  return Boolean(
    profile.id && profile.name?.trim() &&
    ['loss', 'gain', 'recomp', 'maintain', 'strength'].includes(profile.goal) &&
    ['beginner', 'intermediate', 'advanced'].includes(profile.experience) &&
    ['male', 'female'].includes(profile.sex) &&
    Number.isFinite(profile.age) && profile.age >= 14 && profile.age <= 100 &&
    Number.isFinite(profile.heightCm) && profile.heightCm >= 120 && profile.heightCm <= 230 &&
    Number.isFinite(profile.weightKg) && profile.weightKg >= 30 && profile.weightKg <= 350 &&
    Number.isFinite(profile.activityMultiplier) && profile.activityMultiplier >= 1.1 && profile.activityMultiplier <= 2.4 &&
    Number.isInteger(profile.trainingDaysPerWeek) && profile.trainingDaysPerWeek >= 2 && profile.trainingDaysPerWeek <= 6 &&
    Number.isFinite(profile.sessionMinutes) && profile.sessionMinutes >= 20 && profile.sessionMinutes <= 120 &&
    Array.isArray(profile.equipment) && Array.isArray(profile.restrictions)
  );
}

export function createBackup(storage: Storage = localStorage, now = new Date()): FitCoachBackupV1 {
  const profile = parse<UserProfile | null>(storage.getItem(KEYS.profile), null);
  const sessions = parse<WorkoutSession[]>(storage.getItem(KEYS.sessions), []).filter(validSession);
  const foodLog = parse<FoodLogEntry[]>(storage.getItem(KEYS.foodLog), []).filter(validFoodEntry);
  const bodyMetrics = parse<BodyMetric[]>(storage.getItem(KEYS.bodyMetrics), []).filter(validBodyMetric);
  if (!validProfile(profile)) throw new Error('El perfil guardado no es válido y no puede exportarse.');
  return {
    schema: 'fitcoach-next-backup',
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    data: { profile, sessions, foodLog, bodyMetrics }
  };
}

export function validateBackup(value: unknown): FitCoachBackupV1 {
  if (!value || typeof value !== 'object') throw new Error('La copia no tiene un formato válido.');
  const backup = value as Partial<FitCoachBackupV1>;
  if (backup.schema !== 'fitcoach-next-backup' || backup.version !== BACKUP_VERSION || !backup.exportedAt || !backup.data) {
    throw new Error('La copia no es compatible con esta versión de FitCoach Next.');
  }
  const { profile, sessions, foodLog, bodyMetrics } = backup.data;
  if (!validProfile(profile ?? null) || !Array.isArray(sessions) || !sessions.every(validSession) ||
      !Array.isArray(foodLog) || !foodLog.every(validFoodEntry) ||
      !Array.isArray(bodyMetrics) || !bodyMetrics.every(validBodyMetric)) {
    throw new Error('La copia contiene datos dañados o no válidos.');
  }
  return backup as FitCoachBackupV1;
}

export function restoreBackup(value: unknown, storage: Storage = localStorage): FitCoachBackupV1 {
  const backup = validateBackup(value);
  const snapshot = new Map<string, string | null>(Object.values(KEYS).map(key => [key, storage.getItem(key)]));
  try {
    if (backup.data.profile) storage.setItem(KEYS.profile, JSON.stringify(backup.data.profile));
    else storage.removeItem(KEYS.profile);
    storage.setItem(KEYS.sessions, JSON.stringify(backup.data.sessions));
    storage.setItem(KEYS.foodLog, JSON.stringify(backup.data.foodLog));
    storage.setItem(KEYS.bodyMetrics, JSON.stringify(backup.data.bodyMetrics));
    return backup;
  } catch (error) {
    for (const [key, previous] of snapshot) {
      try {
        if (previous === null) storage.removeItem(key); else storage.setItem(key, previous);
      } catch { /* Best-effort rollback for quota/restricted-storage failures. */ }
    }
    throw new Error(`No se pudo restaurar la copia. Se ha recuperado el estado anterior. ${error instanceof Error ? error.message : ''}`.trim());
  }
}

export function backupFileName(date = new Date()): string {
  const local = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return `fitcoach-next-backup-v${BACKUP_VERSION}-${local}.json`;
}
