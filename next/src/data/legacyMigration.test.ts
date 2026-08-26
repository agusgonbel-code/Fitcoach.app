import { describe, expect, it } from 'vitest';
import { mapLegacyProfile, migrateLegacyProfile } from './legacyMigration';

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
