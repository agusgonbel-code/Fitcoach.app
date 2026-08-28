import { beforeEach, describe, expect, it } from 'vitest';
import { loadBodyMetrics, loadFoodLog, loadProfile, loadSessions, saveProfile, validBodyMetric, validFoodEntry, validSession } from './localRepository';
import type { BodyMetric, FoodLogEntry, UserProfile, WorkoutSession } from '../domain/models';

class MemoryStorage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.has(key) ? this.values.get(key)! : null; }
  key(index: number) { return Array.from(this.values.keys())[index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(String(key), String(value)); }
}

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: new MemoryStorage() });
}

const base = (): WorkoutSession => ({ id: 's1', plannedWorkoutId: 'p1', localDate: '2026-08-26', startedAt: '2026-08-26T08:00:00', exercises: [] });
const metric = (overrides: Partial<BodyMetric> = {}): BodyMetric => ({ id: 'm1', localDate: '2026-08-27', weightKg: 80.5, waistCm: 84, bodyFatPct: 18, createdAt: '2026-08-27T08:00:00.000Z', ...overrides });
const food = (overrides: Partial<FoodLogEntry> = {}): FoodLogEntry => ({ id: 'f1', localDate: '2026-08-27', name: 'Arroz y pollo', kcal: 650, proteinG: 48, carbsG: 72, fatG: 18, createdAt: '2026-08-27T12:00:00.000Z', ...overrides });
const profile = (overrides: Partial<UserProfile> = {}): UserProfile => ({ id: 'u1', name: 'Calendario QA', goal: 'recomp', experience: 'intermediate', sex: 'male', age: 40, heightCm: 180, weightKg: 80, activityMultiplier: 1.45, trainingDaysPerWeek: 4, sessionMinutes: 50, preferredTrainingDays: [0, 1, 3, 4], equipment: ['gym'], restrictions: [], ...overrides });

beforeEach(() => localStorage.clear());

describe('profile persistence', () => {
  it('preserves the preferred weekly training calendar after reload', () => {
    saveProfile(profile());
    expect(loadProfile()?.preferredTrainingDays).toEqual([0, 1, 3, 4]);
  });
  it('sanitizes invalid and duplicated preferred training days', () => {
    localStorage.setItem('fitcoach_next_profile_v1', JSON.stringify(profile({ preferredTrainingDays: [0, 0, 3, 7, -1] })));
    expect(loadProfile()?.preferredTrainingDays).toEqual([0, 3]);
  });
  it('sanitizes persisted profile values before they reach training, nutrition or Coach domains', () => {
    const raw = {
      id: '  ',
      name: '  QA Athlete  ',
      goal: 'bulk-forever',
      experience: 'elite',
      sex: 'unknown',
      age: 500,
      heightCm: -2,
      weightKg: 'NaN',
      bodyFatPct: 95,
      activityMultiplier: 99,
      trainingDaysPerWeek: 12,
      sessionMinutes: 500,
      preferredTrainingDays: ['0', 0, 6, 9],
      equipment: [' gym ', 7, '', 'gym', 'dumbbells'],
      restrictions: [' knee ', null, 'knee']
    };
    localStorage.setItem('fitcoach_next_profile_v1', JSON.stringify(raw));

    expect(loadProfile()).toMatchObject({
      name: 'QA Athlete',
      goal: 'recomp',
      experience: 'intermediate',
      sex: 'male',
      age: 35,
      heightCm: 170,
      weightKg: 70,
      bodyFatPct: undefined,
      activityMultiplier: 1.45,
      trainingDaysPerWeek: 4,
      sessionMinutes: 50,
      preferredTrainingDays: [0, 6],
      equipment: ['gym', 'dumbbells'],
      restrictions: ['knee']
    });
    expect(loadProfile()?.id).toBeTruthy();
  });
  it('keeps the raw persisted profile untouched while exposing a safe in-memory view', () => {
    const raw = JSON.stringify({ name: 'Persisted QA', goal: 'invalid', age: -1 });
    localStorage.setItem('fitcoach_next_profile_v1', raw);
    expect(loadProfile()?.goal).toBe('recomp');
    expect(loadProfile()?.age).toBe(35);
    expect(localStorage.getItem('fitcoach_next_profile_v1')).toBe(raw);
  });
});

describe('persisted activity recovery', () => {
  it('quarantines malformed sessions and food at read time without deleting the raw backup data', () => {
    const sessions = '[{"id":"safe-session"}]';
    const foodEntries = '[{"id":"safe-food"}]';
    localStorage.setItem('fitcoach_next_sessions_v1', sessions);
    localStorage.setItem('fitcoach_next_food_log_v1', foodEntries);
    expect(loadSessions()).toEqual([]);
    expect(loadFoodLog()).toEqual([]);
    expect(localStorage.getItem('fitcoach_next_sessions_v1')).toBe(sessions);
    expect(localStorage.getItem('fitcoach_next_food_log_v1')).toBe(foodEntries);
  });

  it('rejects impossible civil dates and invalid timestamps without mutating persisted raw data', () => {
    const corruptSession = { ...base(), localDate: '2026-02-31', startedAt: 'not-a-time', exercises: [{ exerciseId: 'bench', sets: [{ kg: 80, reps: 8, rir: 2, completedAt: '2026-08-26T08:05:00' }] }] };
    const corruptFood = food({ localDate: '2026-04-31', createdAt: 'invalid-time' });
    const corruptMetric = metric({ localDate: '2026-02-30', createdAt: 'broken-time' });
    const rawSessions = JSON.stringify([corruptSession]);
    const rawFood = JSON.stringify([corruptFood]);
    const rawMetrics = JSON.stringify([corruptMetric]);
    localStorage.setItem('fitcoach_next_sessions_v1', rawSessions);
    localStorage.setItem('fitcoach_next_food_log_v1', rawFood);
    localStorage.setItem('fitcoach_next_body_metrics_v1', rawMetrics);

    expect(loadSessions()).toEqual([]);
    expect(loadFoodLog()).toEqual([]);
    expect(loadBodyMetrics()).toEqual([]);
    expect(localStorage.getItem('fitcoach_next_sessions_v1')).toBe(rawSessions);
    expect(localStorage.getItem('fitcoach_next_food_log_v1')).toBe(rawFood);
    expect(localStorage.getItem('fitcoach_next_body_metrics_v1')).toBe(rawMetrics);
  });

  it('quarantines a session when any nested performed set is corrupt', () => {
    const session = { ...base(), exercises: [{ exerciseId: 'bench', sets: [{ kg: 'heavy', reps: 8, rir: 2, completedAt: '2026-08-26T08:05:00' }] }] };
    const raw = JSON.stringify([session]);
    localStorage.setItem('fitcoach_next_sessions_v1', raw);
    expect(loadSessions()).toEqual([]);
    expect(localStorage.getItem('fitcoach_next_sessions_v1')).toBe(raw);
  });
});

describe('validSession', () => {
  it('rejects an empty session', () => { expect(validSession(base())).toBe(false); });
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
  it('rejects impossible dates and invalid completion timestamps', () => {
    const session = base();
    session.localDate = '2026-02-31';
    session.exercises = [{ exerciseId: 'bench', sets: [{ kg: 80, reps: 8, rir: 2, completedAt: '2026-08-26T08:05:00' }] }];
    expect(validSession(session)).toBe(false);
    session.localDate = '2026-08-26';
    session.exercises[0].sets[0].completedAt = 'invalid';
    expect(validSession(session)).toBe(false);
  });
});

describe('validFoodEntry', () => {
  it('rejects impossible dates and invalid creation timestamps', () => {
    expect(validFoodEntry(food({ localDate: '2026-02-30' }))).toBe(false);
    expect(validFoodEntry(food({ createdAt: 'not-a-time' }))).toBe(false);
    expect(validFoodEntry(food())).toBe(true);
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
  it('requires a real local civil date and a parseable creation timestamp', () => {
    expect(validBodyMetric(metric({ localDate: '27/08/2026' }))).toBe(false);
    expect(validBodyMetric(metric({ localDate: '2026-02-30' }))).toBe(false);
    expect(validBodyMetric(metric({ createdAt: 'invalid' }))).toBe(false);
  });
});