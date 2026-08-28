import { describe, expect, it } from 'vitest';
import { clearWorkoutDraft, hasDraftContent, loadWorkoutDraft, saveWorkoutDraft, type DraftStorage, type WorkoutDraft } from './workoutDraft';

class MemoryStorage implements DraftStorage {
  private data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
  removeItem(key: string) { this.data.delete(key); }
}

const KEY = 'fitcoach_next_workout_draft_v1';
const makeDraft = (savedAt: string): WorkoutDraft => ({
  version: 1,
  workoutId: 'upper-a',
  localDate: '2026-08-26',
  startedAt: '2026-08-26T05:00:00.000Z',
  savedAt,
  values: { bench: [{ kg: '80', reps: '10', rir: '0' }] },
});

describe('workout draft', () => {
  it('restores a same-workout same-day draft and preserves RIR 0', () => {
    const storage = new MemoryStorage();
    saveWorkoutDraft(makeDraft('2026-08-26T05:05:00.000Z'), storage);
    const draft = loadWorkoutDraft('upper-a', '2026-08-26', Date.parse('2026-08-26T06:00:00.000Z'), storage);
    expect(draft?.values.bench[0].rir).toBe('0');
  });

  it('rejects drafts from another workout or date', () => {
    const storage = new MemoryStorage();
    saveWorkoutDraft(makeDraft('2026-08-26T05:05:00.000Z'), storage);
    expect(loadWorkoutDraft('lower-a', '2026-08-26', Date.parse('2026-08-26T06:00:00.000Z'), storage)).toBeNull();
    expect(loadWorkoutDraft('upper-a', '2026-08-27', Date.parse('2026-08-27T06:00:00.000Z'), storage)).toBeNull();
  });

  it('expires and removes drafts older than 14 days', () => {
    const storage = new MemoryStorage();
    saveWorkoutDraft(makeDraft('2026-08-01T05:05:00.000Z'), storage);
    expect(loadWorkoutDraft('upper-a', '2026-08-26', Date.parse('2026-08-26T06:00:00.000Z'), storage)).toBeNull();
    expect(storage.getItem(KEY)).toBeNull();
  });

  it('detects content and can clear safely', () => {
    const storage = new MemoryStorage();
    const draft = makeDraft('2026-08-26T05:05:00.000Z');
    expect(hasDraftContent(draft.values)).toBe(true);
    saveWorkoutDraft(draft, storage);
    clearWorkoutDraft(storage);
    expect(loadWorkoutDraft('upper-a', '2026-08-26', Date.now(), storage)).toBeNull();
  });

  it('quarantines malformed nested values without deleting raw recovery data', () => {
    const storage = new MemoryStorage();
    const raw = JSON.stringify({ ...makeDraft('2026-08-26T05:05:00.000Z'), values: { bench: [{ kg: '80', reps: 10, rir: '0' }] } });
    storage.setItem(KEY, raw);
    expect(loadWorkoutDraft('upper-a', '2026-08-26', Date.parse('2026-08-26T06:00:00.000Z'), storage)).toBeNull();
    expect(storage.getItem(KEY)).toBe(raw);
  });

  it('rejects impossible dates, invalid timestamps and reversed timestamps', () => {
    const storage = new MemoryStorage();
    for (const corrupt of [
      { ...makeDraft('2026-08-26T05:05:00.000Z'), localDate: '2026-02-31' },
      { ...makeDraft('not-a-time') },
      { ...makeDraft('2026-08-26T04:59:00.000Z') },
    ]) {
      const raw = JSON.stringify(corrupt);
      storage.setItem(KEY, raw);
      expect(loadWorkoutDraft('upper-a', corrupt.localDate, Date.parse('2026-08-26T06:00:00.000Z'), storage)).toBeNull();
      expect(storage.getItem(KEY)).toBe(raw);
    }
  });

  it('rejects implausibly future drafts and keeps them untouched', () => {
    const storage = new MemoryStorage();
    const raw = JSON.stringify(makeDraft('2026-08-26T07:00:00.000Z'));
    storage.setItem(KEY, raw);
    expect(loadWorkoutDraft('upper-a', '2026-08-26', Date.parse('2026-08-26T06:00:00.000Z'), storage)).toBeNull();
    expect(storage.getItem(KEY)).toBe(raw);
  });

  it('refuses invalid drafts at the write boundary', () => {
    const storage = new MemoryStorage();
    const invalid = { ...makeDraft('2026-08-26T05:05:00.000Z'), values: { bench: [{ kg: '80', reps: '10', rir: 'x'.repeat(17) }] } } as WorkoutDraft;
    expect(() => saveWorkoutDraft(invalid, storage)).toThrow('Borrador de entrenamiento no válido.');
    expect(storage.getItem(KEY)).toBeNull();
  });
});
