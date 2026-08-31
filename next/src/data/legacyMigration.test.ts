import { describe, expect, it } from 'vitest';
import { mapLegacyProfile, migrateLegacyData, migrateLegacyProfile } from './legacyMigration';

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
}

describe('legacy profile migration', () => {
  it('maps the unified v35 profile without losing restrictions or RIR-era training constraints', () => {
    const profile = mapLegacyProfile({
      name: 'Agustín', sex: 'm', age: 46, height: 181, weight: 81,
      goal: 'gain', experience: 'intermediate', activity: 1.45,
      days: 4, minutes: 50, equipment: ['Barra', 'Polea'],
      limitations: 'rodilla sensible', contraindications: 'saltos'
    }, 'legacy-1');
    expect(profile).toMatchObject({
      id: 'legacy-1', goal: 'hypertrophy', sex: 'male', age: 46,
      heightCm: 181, weightKg: 81, trainingDaysPerWeek: 4, sessionMinutes: 50
    });
    expect(profile?.restrictions).toEqual(['rodilla sensible', 'saltos']);
  });

  it('never overwrites a profile already created in Next', () => {
    const storage = new MemoryStorage();
    storage.setItem('fitcoach_next_profile_v1', JSON.stringify({ id: 'next' }));
    storage.setItem('fitcoach_client_profile_v35', JSON.stringify({ age: 46, height: 181, weight: 81 }));
    const result = migrateLegacyProfile(storage, () => 'legacy');
    expect(result).toMatchObject({ migrated: false, reason: 'next-profile-exists' });
    expect(JSON.parse(storage.getItem('fitcoach_next_profile_v1') || '{}').id).toBe('next');
  });

  it('falls back to the legacy nutrition profile when the client profile is unavailable', () => {
    const storage = new MemoryStorage();
    storage.setItem('fitcoach_nutrition_profile_v34', JSON.stringify({
      sex: 'f', age: 38, height: 168, weight: 64, activity: 1.3, goal: 'loss'
    }));
    const result = migrateLegacyProfile(storage, () => 'legacy-nutrition');
    expect(result.migrated).toBe(true);
    expect(result.source).toBe('nutrition-v34');
    expect(result.profile).toMatchObject({ sex: 'female', goal: 'fatloss', age: 38 });
  });

  it('rejects corrupted or implausible legacy anthropometrics', () => {
    const storage = new MemoryStorage();
    storage.setItem('fitcoach_client_profile_v35', JSON.stringify({ age: 4, height: 300, weight: 10 }));
    const result = migrateLegacyProfile(storage, () => 'bad');
    expect(result).toMatchObject({ migrated: false, reason: 'no-valid-legacy-profile' });
  });
});

describe('legacy activity migration', () => {
  it('imports valid workout history and preserves RIR 0', () => {
    const storage = new MemoryStorage();
    storage.setItem('workouts', JSON.stringify([{
      date: '2026-08-25T06:30:00', day: 'Lunes', notes: 'sesión buena',
      exercises: [{ name: 'Press banca', sets: [
        { kg: 80, reps: 10, rir: 0 },
        { kg: 80, reps: 0, rir: 2 }
      ] }]
    }]));
    let id = 0;
    const result = migrateLegacyData(storage, () => String(++id));
    const sessions = JSON.parse(storage.getItem('fitcoach_next_sessions_v1') || '[]');
    expect(result).toMatchObject({ migrated: true, workouts: 1 });
    expect(sessions).toHaveLength(1);
    expect(sessions[0].localDate).toBe('2026-08-25');
    expect(sessions[0].exercises[0].sets).toHaveLength(1);
    expect(sessions[0].exercises[0].sets[0].rir).toBe(0);
  });

  it('imports legacy meals with macros and defaults missing fat to zero', () => {
    const storage = new MemoryStorage();
    storage.setItem('meals', JSON.stringify([
      { date: '2026-08-25', name: 'Pollo y arroz', kcal: 650, protein: 55, carbs: 70, fat: 15 },
      { date: '2026-08-25', name: 'Batido', kcal: 150, protein: 25, carbs: 5 }
    ]));
    let id = 0;
    const result = migrateLegacyData(storage, () => String(++id));
    const meals = JSON.parse(storage.getItem('fitcoach_next_food_log_v1') || '[]');
    expect(result).toMatchObject({ migrated: true, meals: 2 });
    expect(meals[0]).toMatchObject({ name: 'Pollo y arroz', proteinG: 55, carbsG: 70, fatG: 15 });
    expect(meals[1]).toMatchObject({ name: 'Batido', proteinG: 25, carbsG: 5, fatG: 0 });
  });

  it('is idempotent and never duplicates imported history', () => {
    const storage = new MemoryStorage();
    storage.setItem('meals', JSON.stringify([{ date: '2026-08-25', name: 'Comida', kcal: 500, protein: 40 }]));
    const first = migrateLegacyData(storage, () => '1');
    const second = migrateLegacyData(storage, () => '2');
    expect(first.meals).toBe(1);
    expect(second).toMatchObject({ migrated: false, reason: 'already-migrated' });
    expect(JSON.parse(storage.getItem('fitcoach_next_food_log_v1') || '[]')).toHaveLength(1);
  });

  it('does not import empty or invalid legacy sessions', () => {
    const storage = new MemoryStorage();
    storage.setItem('workouts', JSON.stringify([{
      date: '2026-08-25T06:30:00', day: 'Lunes', exercises: [{ name: 'Press banca', sets: [{ kg: 80, reps: 0, rir: 2 }] }]
    }]));
    const result = migrateLegacyData(storage, () => '1');
    expect(result).toMatchObject({ migrated: false, workouts: 0 });
    expect(storage.getItem('fitcoach_next_sessions_v1')).toBeNull();
  });

  it('rejects impossible civil dates from legacy workouts and meals', () => {
    const storage = new MemoryStorage();
    storage.setItem('workouts', JSON.stringify([{
      date: '2026-02-31', day: 'Lunes', exercises: [{ name: 'Press banca', sets: [{ kg: 80, reps: 10, rir: 2 }] }]
    }]));
    storage.setItem('meals', JSON.stringify([
      { date: '2026-02-31', name: 'Comida imposible', kcal: 500, protein: 40 }
    ]));
    const result = migrateLegacyData(storage, () => '1');
    expect(result).toMatchObject({ migrated: false, workouts: 0, meals: 0 });
    expect(storage.getItem('fitcoach_next_sessions_v1')).toBeNull();
    expect(storage.getItem('fitcoach_next_food_log_v1')).toBeNull();
  });

  it('drops sets that would round to zero repetitions instead of persisting invalid Next data', () => {
    const storage = new MemoryStorage();
    storage.setItem('workouts', JSON.stringify([{
      date: '2026-08-25T06:30:00', day: 'Lunes', exercises: [{ name: 'Press banca', sets: [{ kg: 80, reps: 0.2, rir: 2 }] }]
    }]));
    const result = migrateLegacyData(storage, () => '1');
    expect(result).toMatchObject({ migrated: false, workouts: 0 });
    expect(storage.getItem('fitcoach_next_sessions_v1')).toBeNull();
  });

  it('replaces an invalid legacy meal timestamp with a valid deterministic fallback', () => {
    const storage = new MemoryStorage();
    storage.setItem('meals', JSON.stringify([
      { date: '2026-08-25', createdAt: 'not-a-timestamp', name: 'Comida', kcal: 500, protein: 40 }
    ]));
    const result = migrateLegacyData(storage, () => '1');
    const meals = JSON.parse(storage.getItem('fitcoach_next_food_log_v1') || '[]');
    expect(result).toMatchObject({ migrated: true, meals: 1 });
    expect(meals[0].createdAt).toBe('2026-08-25T12:00:00');
  });
});
