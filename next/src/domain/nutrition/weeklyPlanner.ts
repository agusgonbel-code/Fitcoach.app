import { CORE_INGREDIENTS, CORE_RECIPES } from './library';
import { dayMacros, optimizeDay, type MacroVector, type PlannedNutritionDay } from './recipePlanner';

export interface WeeklyNutritionDay {
  day: number;
  plan: PlannedNutritionDay;
  macros: MacroVector;
}

const DAY_TEMPLATES = [
  ['oat-cake', 'chicken-rice', 'skyr-bowl', 'chicken-potato'],
  ['skyr-bowl', 'chicken-potato', 'tuna-toast', 'chicken-rice'],
  ['oat-cake', 'chicken-rice', 'whey-banana', 'chicken-potato'],
  ['skyr-bowl', 'chicken-potato', 'whey-banana', 'chicken-rice'],
  ['oat-cake', 'chicken-rice', 'tuna-toast', 'chicken-potato'],
  ['skyr-bowl', 'chicken-potato', 'tuna-toast', 'chicken-rice'],
  ['oat-cake', 'chicken-rice', 'skyr-bowl', 'tuna-toast'],
];

export function generateWeek(target: MacroVector): WeeklyNutritionDay[] {
  if (!Number.isFinite(target.kcal) || target.kcal < 1000) throw new Error('Daily nutrition target is not valid.');
  return DAY_TEMPLATES.map((recipeIds, index) => {
    const initial: PlannedNutritionDay = { meals: recipeIds.map((recipeId) => ({ recipeId, scale: 1 })) };
    const plan = optimizeDay(initial, CORE_RECIPES, CORE_INGREDIENTS, target, { minScale: 0.6, maxScale: 1.6, iterations: 220 });
    return { day: index + 1, plan, macros: dayMacros(plan, CORE_RECIPES, CORE_INGREDIENTS) };
  });
}
