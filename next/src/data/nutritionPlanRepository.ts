import type { MonthlyNutritionDay } from '../domain/nutrition/monthlyPlanner';
import type { MacroVector } from '../domain/nutrition/recipePlanner';
import type { WeeklyNutritionDay } from '../domain/nutrition/weeklyPlanner';

const NUTRITION_PLAN_KEY = 'fitcoach_next_nutrition_plan_v1';
const VERSION = 1 as const;
const MIN_MEAL_SCALE = 0.55;
const MAX_MEAL_SCALE = 1.65;

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

function validMacroVector(value: unknown): value is MacroVector {
  if (!value || typeof value !== 'object') return false;
  const macros = value as Partial<MacroVector>;
  return finiteNonNegative(macros.kcal) &&
    finiteNonNegative(macros.proteinG) &&
    finiteNonNegative(macros.carbsG) &&
    finiteNonNegative(macros.fatG);
}

function validTarget(value: unknown): value is MacroVector {
  return validMacroVector(value) && value.kcal >= 1000;
}

function sameTarget(a: MacroVector, b: MacroVector): boolean {
  return Math.abs(a.kcal - b.kcal) < 0.01 &&
    Math.abs(a.proteinG - b.proteinG) < 0.01 &&
    Math.abs(a.carbsG - b.carbsG) < 0.01 &&
    Math.abs(a.fatG - b.fatG) < 0.01;
}

function validPlan(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const plan = value as { meals?: unknown };
  if (!Array.isArray(plan.meals) || plan.meals.length === 0) return false;
  return plan.meals.every((meal) => {
    if (!meal || typeof meal !== 'object') return false;
    const item = meal as { recipeId?: unknown; scale?: unknown };
    return typeof item.recipeId === 'string' && item.recipeId.length > 0 &&
      typeof item.scale === 'number' && Number.isFinite(item.scale) &&
      item.scale >= MIN_MEAL_SCALE && item.scale <= MAX_MEAL_SCALE;
  });
}

function validWeeklyDay(value: unknown, index: number): value is WeeklyNutritionDay {
  if (!value || typeof value !== 'object') return false;
  const day = value as Partial<WeeklyNutritionDay>;
  return day.day === index + 1 && validPlan(day.plan) && validMacroVector(day.macros);
}

function validMonthlyDay(value: unknown, index: number): value is MonthlyNutritionDay {
  if (!value || typeof value !== 'object') return false;
  const day = value as Partial<MonthlyNutritionDay>;
  const expectedDay = index + 1;
  const expectedWeek = Math.floor(index / 7) + 1;
  return day.day === expectedDay && day.week === expectedWeek && validPlan(day.plan) && validMacroVector(day.macros);
}

function validOverrides(value: unknown): value is Record<string, PersistedMealOverride> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.values(value as Record<string, unknown>).every((override) => {
    if (!override || typeof override !== 'object') return false;
    const item = override as Partial<PersistedMealOverride>;
    return typeof item.recipeId === 'string' && item.recipeId.length > 0 &&
      typeof item.scale === 'number' && Number.isFinite(item.scale) &&
      item.scale >= MIN_MEAL_SCALE && item.scale <= MAX_MEAL_SCALE;
  });
}

export function validPersistedNutritionPlan(value: unknown): value is PersistedNutritionPlan {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<PersistedNutritionPlan>;
  if (state.version !== VERSION || typeof state.profileId !== 'string' || !state.profileId || !validTarget(state.target)) return false;
  if (!Array.isArray(state.week) || state.week.length !== 7 || !state.week.every(validWeeklyDay)) return false;
  if (!Array.isArray(state.month) || state.month.length !== 30 || !state.month.every(validMonthlyDay)) return false;
  if (!validOverrides(state.overrides)) return false;
  if (state.horizon !== 'week' && state.horizon !== 'month') return false;
  const maxDay = state.horizon === 'week' ? 7 : 30;
  if (!Number.isInteger(state.selectedDay) || Number(state.selectedDay) < 1 || Number(state.selectedDay) > maxDay) return false;
  return typeof state.updatedAt === 'string' && state.updatedAt.length > 0;
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
    if (!validPersistedNutritionPlan(value) || value.profileId !== profileId || !sameTarget(value.target, target)) return null;
    return value;
  } catch {
    return null;
  }
}

export function writeNutritionPlan(
  storage: Pick<Storage, 'setItem'>,
  state: PersistedNutritionPlan,
): void {
  if (!validPersistedNutritionPlan(state)) {
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
