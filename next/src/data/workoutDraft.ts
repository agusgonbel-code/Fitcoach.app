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
const MAX_EXERCISES = 64;
const MAX_SETS_PER_EXERCISE = 32;
const MAX_FIELD_LENGTH = 16;

export interface DraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function isCivilDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 64 && Number.isFinite(Date.parse(value));
}

function isDraftField(value: unknown): value is string {
  return typeof value === 'string' && value.length <= MAX_FIELD_LENGTH;
}

function isDraftSet(value: unknown): value is WorkoutDraftSet {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const set = value as Partial<WorkoutDraftSet>;
  return isDraftField(set.kg) && isDraftField(set.reps) && isDraftField(set.rir);
}

function isDraftValues(value: unknown): value is Record<string, WorkoutDraftSet[]> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  if (entries.length > MAX_EXERCISES) return false;
  return entries.every(([exerciseId, sets]) =>
    exerciseId.length > 0 && exerciseId.length <= 128 &&
    Array.isArray(sets) && sets.length <= MAX_SETS_PER_EXERCISE && sets.every(isDraftSet));
}

function isWorkoutDraft(value: unknown): value is WorkoutDraft {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const draft = value as Partial<WorkoutDraft>;
  if (draft.version !== 1 || typeof draft.workoutId !== 'string' || draft.workoutId.length === 0 || draft.workoutId.length > 128) return false;
  if (!isCivilDate(draft.localDate) || !isTimestamp(draft.startedAt) || !isTimestamp(draft.savedAt) || !isDraftValues(draft.values)) return false;
  return Date.parse(draft.startedAt) <= Date.parse(draft.savedAt);
}

export function saveWorkoutDraft(draft: WorkoutDraft, storage: DraftStorage = localStorage): void {
  if (!isWorkoutDraft(draft)) throw new Error('Borrador de entrenamiento no válido.');
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
    const draft: unknown = JSON.parse(raw);
    if (!isWorkoutDraft(draft) || draft.workoutId !== workoutId || draft.localDate !== localDate || !isCivilDate(localDate)) {
      return null;
    }
    const savedAt = Date.parse(draft.savedAt);
    if (now - savedAt > MAX_AGE_MS) {
      storage.removeItem(KEY);
      return null;
    }
    if (savedAt > now + 5 * 60 * 1000) return null;
    return draft;
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
