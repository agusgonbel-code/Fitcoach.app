import { CORE_INGREDIENTS, CORE_RECIPES } from './library';
import { dayMacros, optimizeDay, type MacroVector, type PlannedNutritionDay } from './recipePlanner';

export interface WeeklyNutritionDay {
  day: number;
  plan: PlannedNutritionDay;
  macros: MacroVector;
}

// Five eating occasions improve practicality for users who prefer spreading protein
// across the day while the optimizer still respects the individual daily target.
const DAY_TEMPLATES = [
  ['oat-cake', 'chicken-rice', 'skyr-bowl', 'turkey-wrap', 'greek-fruit'],
  ['skyr-bowl', 'salmon-potato', 'cottage-toast', 'lentil-chicken', 'whey-banana'],
  ['oat-cake', 'turkey-pasta', 'greek-fruit', 'chickpea-tuna', 'skyr-banana'],
  ['skyr-bowl', 'chicken-potato', 'whey-banana', 'turkey-wrap', 'cottage-toast'],
  ['oat-cake', 'lentil-chicken', 'skyr-banana', 'salmon-potato', 'greek-fruit'],
  ['cottage-toast', 'chickpea-tuna', 'skyr-bowl', 'turkey-pasta', 'whey-banana'],
  ['oat-cake', 'chicken-rice', 'greek-fruit', 'tuna-toast', 'skyr-banana'],
];

export function generateWeek(target: MacroVector): WeeklyNutritionDay[] {
  if (!Number.isFinite(target.kcal) || target.kcal < 1000) throw new Error('Daily nutrition target is not valid.');
  return DAY_TEMPLATES.map((recipeIds, index) => {
    const initial: PlannedNutritionDay = { meals: recipeIds.map((recipeId) => ({ recipeId, scale: 1 })) };
    const plan = optimizeDay(initial, CORE_RECIPES, CORE_INGREDIENTS, target, { minScale: 0.55, maxScale: 1.7, iterations: 280 });
    return { day: index + 1, plan, macros: dayMacros(plan, CORE_RECIPES, CORE_INGREDIENTS) };
  });
}
