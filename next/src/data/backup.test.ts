import { describe, expect, it } from 'vitest';
import { backupFileName, createBackup, restoreBackup, validateBackup } from './backup';

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() { return this.map.size; }
  clear() { this.map.clear(); }
  getItem(key: string) { return this.map.get(key) ?? null; }
  key(index: number) { return [...this.map.keys()][index] ?? null; }
  removeItem(key: string) { this.map.delete(key); }
  setItem(key: string, value: string) { this.map.set(key, String(value)); }
}

const profile = {
  id: 'u1', name: 'Test', goal: 'recomp', experience: 'intermediate', sex: 'male', age: 40,
  heightCm: 180, weightKg: 80, activityMultiplier: 1.45, trainingDaysPerWeek: 4,
  sessionMinutes: 50, preferredTrainingDays: [0, 1, 3, 4], equipment: ['gym'], restrictions: []
} as const;

const session = {
  id: 's1', plannedWorkoutId: 'p1', localDate: '2026-08-27', startedAt: '2026-08-27T06:00:00.000Z',
  completedAt: '2026-08-27T06:50:00.000Z', exercises: [{ exerciseId: 'bench', sets: [{ kg: 80, reps: 10, rir: 0, completedAt: '2026-08-27T06:10:00.000Z' }] }]
};

const meal = { id: 'm1', localDate: '2026-08-27', name: 'Comida', kcal: 600, proteinG: 45, carbsG: 70, fatG: 15, createdAt: '2026-08-27T12:00:00.000Z' };
const metric = { id: 'b1', localDate: '2026-08-27', weightKg: 80, waistCm: 85, createdAt: '2026-08-27T07:00:00.000Z' };

describe('FitCoach Next backup', () => {
  it('exports valid core data and preserves RIR 0', () => {
    const storage = new MemoryStorage();
    storage.setItem('fitcoach_next_profile_v1', JSON.stringify(profile));
    storage.setItem('fitcoach_next_sessions_v1', JSON.stringify([session]));
    storage.setItem('fitcoach_next_food_log_v1', JSON.stringify([meal]));
    storage.setItem('fitcoach_next_body_metrics_v1', JSON.stringify([metric]));

    const backup = createBackup(storage, new Date('2026-08-27T10:00:00.000Z'));
    expect(backup.version).toBe(1);
    expect(backup.data.profile?.goal).toBe('recomp');
    expect(backup.data.sessions[0].exercises[0].sets[0].rir).toBe(0);
    expect(backup.data.foodLog).toHaveLength(1);
    expect(backup.data.bodyMetrics).toHaveLength(1);
  });

  it('rejects incompatible and corrupted backups before writing', () => {
    expect(() => validateBackup({ schema: 'fitcoach-next-backup', version: 99, exportedAt: 'x', data: {} })).toThrow(/compatible/);
    const bad = {
      schema: 'fitcoach-next-backup', version: 1, exportedAt: '2026-08-27T10:00:00.000Z',
      data: { profile, sessions: [{ ...session, exercises: [] }], foodLog: [meal], bodyMetrics: [metric] }
    };
    expect(() => validateBackup(bad)).toThrow(/dañados/);
  });

  it('restores a validated backup over existing data', () => {
    const source = new MemoryStorage();
    source.setItem('fitcoach_next_profile_v1', JSON.stringify(profile));
    source.setItem('fitcoach_next_sessions_v1', JSON.stringify([session]));
    source.setItem('fitcoach_next_food_log_v1', JSON.stringify([meal]));
    source.setItem('fitcoach_next_body_metrics_v1', JSON.stringify([metric]));
    const backup = createBackup(source);

    const target = new MemoryStorage();
    target.setItem('fitcoach_next_profile_v1', JSON.stringify({ ...profile, name: 'Anterior' }));
    restoreBackup(backup, target);
    expect(JSON.parse(target.getItem('fitcoach_next_profile_v1')!).name).toBe('Test');
    expect(JSON.parse(target.getItem('fitcoach_next_sessions_v1')!)[0].exercises[0].sets[0].rir).toBe(0);
  });

  it('uses a local civil date in the exported filename', () => {
    expect(backupFileName(new Date(2026, 7, 27, 23, 59))).toBe('fitcoach-next-backup-v1-2026-08-27.json');
  });
});
