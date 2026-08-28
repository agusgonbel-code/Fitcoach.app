import { describe, expect, it } from 'vitest';
import { deleteAllFitCoachNextData, LEGACY_MIGRATION_SUPPRESSION_KEY } from './privacyRepository';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(key: string) { return this.data.has(key) ? this.data.get(key)! : null; }
  key(index: number) { return Array.from(this.data.keys())[index] ?? null; }
  removeItem(key: string) { this.data.delete(key); }
  setItem(key: string, value: string) { this.data.set(key, value); }
}

describe('deleteAllFitCoachNextData', () => {
  it('removes every Next key and progress photo without touching legacy data or allowing reimport', async () => {
    const storage = new MemoryStorage();
    storage.setItem('fitcoach_next_profile_v1', '{"name":"QA"}');
    storage.setItem('fitcoach_next_sessions_v1', '[]');
    storage.setItem('fitcoach_next_workout_draft_v1', '{}');
    storage.setItem('fitcoach_next_legacy_data_migration_v1', 'done');
    storage.setItem('fitcoach_client_profile_v35', '{"name":"Legacy"}');
    storage.setItem('workouts', '[{"legacy":true}]');

    const removedPhotoIds: string[] = [];
    const result = await deleteAllFitCoachNextData(storage, {
      load: async () => [
        { id: 'photo-1' },
        { id: 'photo-2' },
      ] as never,
      remove: async id => { removedPhotoIds.push(id); },
    });

    expect(result).toEqual({ removedStorageKeys: 4, removedPhotos: 2 });
    expect(storage.getItem('fitcoach_next_profile_v1')).toBeNull();
    expect(storage.getItem('fitcoach_next_sessions_v1')).toBeNull();
    expect(storage.getItem('fitcoach_next_workout_draft_v1')).toBeNull();
    expect(storage.getItem('fitcoach_next_legacy_data_migration_v1')).toBeNull();
    expect(storage.getItem(LEGACY_MIGRATION_SUPPRESSION_KEY)).toBe('true');
    expect(storage.getItem('fitcoach_client_profile_v35')).toBe('{"name":"Legacy"}');
    expect(storage.getItem('workouts')).toBe('[{"legacy":true}]');
    expect(removedPhotoIds).toEqual(['photo-1', 'photo-2']);
  });
});
