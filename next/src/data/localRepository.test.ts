import { beforeEach, describe, expect, it } from 'vitest';
import { loadProfile, saveProfile, validBodyMetric, validSession } from './localRepository';
import type { BodyMetric, UserProfile, WorkoutSession } from '../domain/models';

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
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: new MemoryStorage(),
  });
}

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

const profile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  id: 'u1',
  name: 'Calendario QA',
  goal: 'recomp',
  experience: 'intermediate',
  sex: 'male',
  age: 40,
  heightCm: 180,
  weightKg: 80,
  activityMultiplier: 1.45,
  trainingDaysPerWeek: 4,
  sessionMinutes: 50,
  preferredTrainingDays: [0, 1, 3, 4],
  equipment: ['gym'],
  restrictions: [],
  ...overrides,
});

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
