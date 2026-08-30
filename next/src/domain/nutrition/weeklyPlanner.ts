import { CORE_INGREDIENTS, CORE_RECIPES } from './library';
import { dayMacros, optimizeDay, type MacroVector, type PlannedNutritionDay } from './recipePlanner';

export interface WeeklyNutritionDay {
  day: number;
  plan: PlannedNutritionDay;
  macros: MacroVector;
}

// Backward-compatible legacy generator. The live nutrition screen uses personalizedPlanner,
// where meal count is selected by the user instead of being fixed here.
const DAY_TEMPLATES = [
  ['oat-cake', 'chicken-rice', 'skyr-bowl', 'chicken-potato'],
  ['skyr-bowl', 'salmon-potato', 'cottage-toast', 'lentil-chicken'],
  ['oat-cake', 'turkey-pasta', 'greek-fruit', 'chickpea-tuna'],
  ['skyr-bowl', 'chicken-potato', 'whey-banana', 'turkey-wrap'],
  ['oat-cake', 'lentil-chicken', 'skyr-banana', 'salmon-potato'],
  ['cottage-toast', 'chickpea-tuna', 'skyr-bowl', 'turkey-pasta'],
  ['oat-cake', 'chicken-rice', 'greek-fruit', 'tuna-toast'],
];

export function generateWeek(target: MacroVector): WeeklyNutritionDay[] {
  if (!Number.isFinite(target.kcal) || target.kcal < 1000) throw new Error('Daily nutrition target is not valid.');
  return DAY_TEMPLATES.map((recipeIds, index) => {
    const initial: PlannedNutritionDay = { meals: recipeIds.map((recipeId) => ({ recipeId, scale: 1 })) };
    const plan = optimizeDay(initial, CORE_RECIPES, CORE_INGREDIENTS, target, { minScale: 0.6, maxScale: 1.6, iterations: 220 });
    return { day: index + 1, plan, macros: dayMacros(plan, CORE_RECIPES, CORE_INGREDIENTS) };
  });
}
