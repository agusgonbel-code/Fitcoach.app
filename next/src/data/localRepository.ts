import type { UserProfile, WorkoutSession } from '../domain/models';

const PROFILE_KEY = 'fitcoach_next_profile_v1';
const SESSIONS_KEY = 'fitcoach_next_sessions_v1';

export function localDate(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

export function loadProfile(): UserProfile | null {
  return readJson<UserProfile | null>(PROFILE_KEY, null);
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadSessions(): WorkoutSession[] {
  return readJson<WorkoutSession[]>(SESSIONS_KEY, []);
}

export function validSession(session: WorkoutSession): boolean {
  return session.exercises.some(exercise => exercise.sets.some(set =>
    Number.isFinite(set.kg) && set.kg >= 0 &&
    Number.isFinite(set.reps) && set.reps > 0 &&
    (set.rir === null || (Number.isFinite(set.rir) && set.rir >= 0 && set.rir <= 10))
  ));
}

export function saveSession(session: WorkoutSession): void {
  if (!validSession(session)) throw new Error('La sesión necesita al menos una serie válida.');
  const sessions = loadSessions();
  const next = [...sessions.filter(item => item.id !== session.id), session];
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(next));
}
