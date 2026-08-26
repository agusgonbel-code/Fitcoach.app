import type { MonthlyNutritionDay } from '../domain/nutrition/monthlyPlanner';
import type { MacroVector } from '../domain/nutrition/recipePlanner';
import type { WeeklyNutritionDay } from '../domain/nutrition/weeklyPlanner';

const NUTRITION_PLAN_KEY = 'fitcoach_next_nutrition_plan_v1';
const VERSION = 1 as const;

export interface PersistedMealOverride {
  recipeId: string;
  scale: number;
}

export interface PersistedNutritionPlan {
  version: typeof VERSION;
  profileId: string;
  target: MacroVector;
  week: WeeklyNutritionDay[];
  month: MonthlyNutritionDay[];
  overrides: Record<string, PersistedMealOverride>;
  horizon: 'week' | 'month';
  selectedDay: number;
  updatedAt: string;
}

function finiteNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function validTarget(value: unknown): value is MacroVector {
  if (!value || typeof value !== 'object') return false;
  const target = value as Partial<MacroVector>;
  return finiteNonNegative(target.kcal) && target.kcal >= 1000 &&
    finiteNonNegative(target.proteinG) &&
    finiteNonNegative(target.carbsG) &&
    finiteNonNegative(target.fatG);
}

function sameTarget(a: MacroVector, b: MacroVector): boolean {
  return Math.abs(a.kcal - b.kcal) < 0.01 &&
    Math.abs(a.proteinG - b.proteinG) < 0.01 &&
    Math.abs(a.carbsG - b.carbsG) < 0.01 &&
    Math.abs(a.fatG - b.fatG) < 0.01;
}

function validPlanDay(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const day = value as { day?: unknown; plan?: { meals?: unknown } };
  if (!Number.isInteger(day.day) || Number(day.day) < 1) return false;
  if (!day.plan || !Array.isArray(day.plan.meals) || day.plan.meals.length === 0) return false;
  return day.plan.meals.every((meal) => {
    if (!meal || typeof meal !== 'object') return false;
    const item = meal as { recipeId?: unknown; scale?: unknown };
    return typeof item.recipeId === 'string' && item.recipeId.length > 0 &&
      typeof item.scale === 'number' && Number.isFinite(item.scale) && item.scale > 0;
  });
}

function validOverrides(value: unknown): value is Record<string, PersistedMealOverride> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.values(value as Record<string, unknown>).every((override) => {
    if (!override || typeof override !== 'object') return false;
    const item = override as Partial<PersistedMealOverride>;
    return typeof item.recipeId === 'string' && item.recipeId.length > 0 &&
      typeof item.scale === 'number' && Number.isFinite(item.scale) &&
      item.scale >= 0.55 && item.scale <= 1.65;
  });
}

export function readNutritionPlan(
  storage: Pick<Storage, 'getItem'>,
  profileId: string,
  target: MacroVector,
): PersistedNutritionPlan | null {
  try {
    const raw = storage.getItem(NUTRITION_PLAN_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<PersistedNutritionPlan>;
    if (value.version !== VERSION || value.profileId !== profileId || !validTarget(value.target)) return null;
    if (!sameTarget(value.target, target)) return null;
    if (!Array.isArray(value.week) || value.week.length !== 7 || !value.week.every(validPlanDay)) return null;
    if (!Array.isArray(value.month) || value.month.length !== 30 || !value.month.every(validPlanDay)) return null;
    if (!validOverrides(value.overrides)) return null;
    if (value.horizon !== 'week' && value.horizon !== 'month') return null;
    if (!Number.isInteger(value.selectedDay) || Number(value.selectedDay) < 1) return null;
    if (typeof value.updatedAt !== 'string' || !value.updatedAt) return null;
    return value as PersistedNutritionPlan;
  } catch {
    return null;
  }
}

export function writeNutritionPlan(
  storage: Pick<Storage, 'setItem'>,
  state: PersistedNutritionPlan,
): void {
  if (!state.profileId || !validTarget(state.target) || state.week.length !== 7 || state.month.length !== 30) {
    throw new Error('El plan nutricional no es válido y no se puede guardar.');
  }
  storage.setItem(NUTRITION_PLAN_KEY, JSON.stringify(state));
}

export function removeNutritionPlan(storage: Pick<Storage, 'removeItem'>): void {
  storage.removeItem(NUTRITION_PLAN_KEY);
}

export function nutritionPlanStorageKey(): string {
  return NUTRITION_PLAN_KEY;
}
