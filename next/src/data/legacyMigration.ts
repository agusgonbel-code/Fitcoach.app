import type { Goal, Sex, UserProfile } from '../domain/models';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

const NEXT_PROFILE_KEY = 'fitcoach_next_profile_v1';
const LEGACY_CLIENT_KEY = 'fitcoach_client_profile_v35';
const LEGACY_NUTRITION_KEY = 'fitcoach_nutrition_profile_v34';

export interface LegacyMigrationResult {
  migrated: boolean;
  source: 'client-v35' | 'nutrition-v34' | 'none';
  profile: UserProfile | null;
  reason?: 'next-profile-exists' | 'no-valid-legacy-profile';
}

function parseObject(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function finiteNumber(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function mapGoal(value: unknown): Goal {
  switch (String(value || '').toLowerCase()) {
    case 'loss':
    case 'fatloss': return 'fatloss';
    case 'gain':
    case 'hypertrophy': return 'hypertrophy';
    case 'strength': return 'strength';
    case 'maintain': return 'maintain';
    default: return 'recomp';
  }
}

function mapSex(value: unknown): Sex {
  return String(value || '').toLowerCase() === 'f' || String(value || '').toLowerCase() === 'female' ? 'female' : 'male';
}

function textRestrictions(...values: unknown[]): string[] {
  return values
    .flatMap(value => String(value || '').split(/[\n;,]+/))
    .map(value => value.trim())
    .filter(Boolean);
}

export function mapLegacyProfile(raw: Record<string, unknown>, id: string): UserProfile | null {
  const age = finiteNumber(raw.age);
  const heightCm = finiteNumber(raw.height ?? raw.heightCm);
  const weightKg = finiteNumber(raw.weight ?? raw.weightKg);
  if (!age || age < 14 || age > 100 || !heightCm || heightCm < 120 || heightCm > 230 || !weightKg || weightKg < 35 || weightKg > 350) {
    return null;
  }

  const days = finiteNumber(raw.days ?? raw.trainingDaysPerWeek) ?? 4;
  const minutes = finiteNumber(raw.minutes ?? raw.sessionMinutes) ?? 50;
  const activity = finiteNumber(raw.activity ?? raw.activityMultiplier) ?? 1.45;
  const bodyFat = finiteNumber(raw.bodyFat ?? raw.bodyFatPct);
  const experience = ['beginner', 'intermediate', 'advanced'].includes(String(raw.experience))
    ? String(raw.experience) as UserProfile['experience']
    : 'intermediate';

  return {
    id,
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : 'Atleta',
    goal: mapGoal(raw.goal),
    experience,
    sex: mapSex(raw.sex),
    age: Math.round(age),
    heightCm,
    weightKg,
    bodyFatPct: bodyFat && bodyFat >= 3 && bodyFat <= 70 ? bodyFat : undefined,
    activityMultiplier: Math.min(2.2, Math.max(1.1, activity)),
    trainingDaysPerWeek: Math.min(6, Math.max(2, Math.round(days))),
    sessionMinutes: Math.min(120, Math.max(20, Math.round(minutes))),
    equipment: Array.isArray(raw.equipment) ? raw.equipment.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [],
    restrictions: textRestrictions(raw.limitations, raw.conditions, raw.contraindications)
  };
}

export function migrateLegacyProfile(storage: StorageLike, createId: () => string): LegacyMigrationResult {
  if (parseObject(storage.getItem(NEXT_PROFILE_KEY))) {
    return { migrated: false, source: 'none', profile: null, reason: 'next-profile-exists' };
  }

  const client = parseObject(storage.getItem(LEGACY_CLIENT_KEY));
  const nutrition = parseObject(storage.getItem(LEGACY_NUTRITION_KEY));
  const candidates: Array<{ source: LegacyMigrationResult['source']; raw: Record<string, unknown> | null }> = [
    { source: 'client-v35', raw: client },
    { source: 'nutrition-v34', raw: nutrition }
  ];

  for (const candidate of candidates) {
    if (!candidate.raw) continue;
    const profile = mapLegacyProfile(candidate.raw, createId());
    if (!profile) continue;
    storage.setItem(NEXT_PROFILE_KEY, JSON.stringify(profile));
    return { migrated: true, source: candidate.source, profile };
  }

  return { migrated: false, source: 'none', profile: null, reason: 'no-valid-legacy-profile' };
}
