export type DietStyle = 'omnivore' | 'pescatarian' | 'vegetarian' | 'vegan';
export type BudgetLevel = 'economy' | 'standard' | 'flexible';
export type WeighingPreference = 'as-listed' | 'raw' | 'cooked' | 'label';

export interface NutritionPreferences {
  version: 1;
  profileId: string;
  mealsPerDay: number;
  mealTimes: string[];
  trainingTime: string;
  dietStyle: DietStyle;
  allergies: string[];
  excludedFoods: string[];
  preferredFoods: string[];
  maxPrepMinutes: number;
  budget: BudgetLevel;
  weighingPreference: WeighingPreference;
  updatedAt: string;
}

const KEY = 'fitcoach_next_nutrition_preferences_v1';
const DIETS: DietStyle[] = ['omnivore', 'pescatarian', 'vegetarian', 'vegan'];
const BUDGETS: BudgetLevel[] = ['economy', 'standard', 'flexible'];
const WEIGHING: WeighingPreference[] = ['as-listed', 'raw', 'cooked', 'label'];

function uniqueStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === 'string').map(item => item.trim().toLowerCase()).filter(Boolean))];
}

function validTime(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function defaultMealTimes(mealsPerDay: number): string[] {
  const presets: Record<number, string[]> = {
    3: ['08:00', '14:00', '20:30'],
    4: ['07:30', '12:00', '16:30', '20:30'],
    5: ['07:00', '10:30', '14:00', '17:30', '21:00'],
    6: ['07:00', '10:00', '13:00', '16:00', '19:00', '21:30'],
  };
  return presets[mealsPerDay] ?? presets[4];
}

export function defaultNutritionPreferences(profileId: string): NutritionPreferences {
  return {
    version: 1,
    profileId,
    mealsPerDay: 4,
    mealTimes: defaultMealTimes(4),
    trainingTime: '18:00',
    dietStyle: 'omnivore',
    allergies: [],
    excludedFoods: [],
    preferredFoods: [],
    maxPrepMinutes: 30,
    budget: 'standard',
    weighingPreference: 'as-listed',
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeNutritionPreferences(value: Partial<NutritionPreferences> | null | undefined, profileId: string): NutritionPreferences {
  const fallback = defaultNutritionPreferences(profileId);
  const meals = Number.isFinite(Number(value?.mealsPerDay)) ? Math.min(6, Math.max(3, Math.round(Number(value?.mealsPerDay)))) : fallback.mealsPerDay;
  const suppliedTimes = Array.isArray(value?.mealTimes) ? value!.mealTimes.filter(validTime).slice(0, meals) : [];
  return {
    version: 1,
    profileId,
    mealsPerDay: meals,
    mealTimes: suppliedTimes.length === meals ? suppliedTimes : defaultMealTimes(meals),
    trainingTime: validTime(value?.trainingTime) ? value!.trainingTime! : fallback.trainingTime,
    dietStyle: DIETS.includes(value?.dietStyle as DietStyle) ? value!.dietStyle as DietStyle : fallback.dietStyle,
    allergies: uniqueStrings(value?.allergies),
    excludedFoods: uniqueStrings(value?.excludedFoods),
    preferredFoods: uniqueStrings(value?.preferredFoods),
    maxPrepMinutes: Number.isFinite(Number(value?.maxPrepMinutes)) ? Math.min(90, Math.max(5, Math.round(Number(value?.maxPrepMinutes)))) : fallback.maxPrepMinutes,
    budget: BUDGETS.includes(value?.budget as BudgetLevel) ? value!.budget as BudgetLevel : fallback.budget,
    weighingPreference: WEIGHING.includes(value?.weighingPreference as WeighingPreference) ? value!.weighingPreference as WeighingPreference : fallback.weighingPreference,
    updatedAt: typeof value?.updatedAt === 'string' && value.updatedAt ? value.updatedAt : fallback.updatedAt,
  };
}

export function readNutritionPreferences(storage: Pick<Storage, 'getItem'>, profileId: string): NutritionPreferences {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return defaultNutritionPreferences(profileId);
    const parsed = JSON.parse(raw) as Partial<NutritionPreferences>;
    if (parsed.profileId !== profileId) return defaultNutritionPreferences(profileId);
    return normalizeNutritionPreferences(parsed, profileId);
  } catch {
    return defaultNutritionPreferences(profileId);
  }
}

export function writeNutritionPreferences(storage: Pick<Storage, 'setItem'>, preferences: NutritionPreferences): NutritionPreferences {
  const normalized = normalizeNutritionPreferences({ ...preferences, updatedAt: new Date().toISOString() }, preferences.profileId);
  storage.setItem(KEY, JSON.stringify(normalized));
  return normalized;
}

export function nutritionPreferencesFingerprint(preferences: NutritionPreferences): string {
  return [
    preferences.mealsPerDay,
    preferences.mealTimes.join(','),
    preferences.trainingTime,
    preferences.dietStyle,
    preferences.allergies.join(','),
    preferences.excludedFoods.join(','),
    preferences.preferredFoods.join(','),
    preferences.maxPrepMinutes,
    preferences.budget,
    preferences.weighingPreference,
  ].join('|');
}
