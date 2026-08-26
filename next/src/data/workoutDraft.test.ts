import { describe, expect, it } from 'vitest';
import { clearWorkoutDraft, hasDraftContent, loadWorkoutDraft, saveWorkoutDraft, type DraftStorage, type WorkoutDraft } from './workoutDraft';

class MemoryStorage implements DraftStorage {
  private data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
  removeItem(key: string) { this.data.delete(key); }
}

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
  });

  it('detects content and can clear safely', () => {
    const storage = new MemoryStorage();
    const draft = makeDraft('2026-08-26T05:05:00.000Z');
    expect(hasDraftContent(draft.values)).toBe(true);
    saveWorkoutDraft(draft, storage);
    clearWorkoutDraft(storage);
    expect(loadWorkoutDraft('upper-a', '2026-08-26', Date.now(), storage)).toBeNull();
  });
});
