export type WorkoutDraftSet = { kg: string; reps: string; rir: string };

export type WorkoutDraft = {
  version: 1;
  workoutId: string;
  localDate: string;
  startedAt: string;
  savedAt: string;
  values: Record<string, WorkoutDraftSet[]>;
};

const KEY = 'fitcoach_next_workout_draft_v1';
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export interface DraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function saveWorkoutDraft(draft: WorkoutDraft, storage: DraftStorage = localStorage): void {
  storage.setItem(KEY, JSON.stringify(draft));
}

export function loadWorkoutDraft(
  workoutId: string,
  localDate: string,
  now = Date.now(),
  storage: DraftStorage = localStorage,
): WorkoutDraft | null {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<WorkoutDraft>;
    if (draft.version !== 1 || draft.workoutId !== workoutId || draft.localDate !== localDate || !draft.startedAt || !draft.savedAt || !draft.values) {
      return null;
    }
    const savedAt = Date.parse(draft.savedAt);
    if (!Number.isFinite(savedAt) || now - savedAt > MAX_AGE_MS) {
      storage.removeItem(KEY);
      return null;
    }
    return draft as WorkoutDraft;
  } catch {
    return null;
  }
}

export function clearWorkoutDraft(storage: DraftStorage = localStorage): void {
  storage.removeItem(KEY);
}

export function hasDraftContent(values: Record<string, WorkoutDraftSet[]>): boolean {
  return Object.values(values).some(sets => sets.some(set => set.kg !== '' || set.reps !== '' || set.rir !== ''));
}
