import { CORE_INGREDIENTS, CORE_RECIPES } from './library';
import { dayMacros, optimizeDay, type MacroVector, type PlannedNutritionDay } from './recipePlanner';

export interface MonthlyNutritionDay {
  day: number;
  week: number;
  plan: PlannedNutritionDay;
  macros: MacroVector;
}

// 30-day recomposition / lean-muscle template. The pre-workout oat cake is kept
// first on training-oriented days and the remaining slots rotate through macro-
// compatible chicken, fish, yoghurt and legume recipes already audited by the app.
// optimizeDay scales portions to the user's calculated target, so this preset is
// reusable rather than hard-coding one person's calorie requirement.
const MONTH_TEMPLATE: string[][] = [
  ['oat-cake','chicken-rice','skyr-bowl','salmon-potato'],
  ['oat-cake','turkey-pasta','skyr-banana','chicken-potato'],
  ['oat-cake','chicken-rice','greek-fruit','chickpea-tuna'],
  ['oat-cake','chicken-potato','skyr-bowl','salmon-potato'],
  ['oat-cake','chicken-rice','skyr-banana','turkey-wrap'],
  ['oat-cake','lentil-chicken','greek-fruit','salmon-potato'],
  ['oat-cake','turkey-pasta','skyr-bowl','tuna-toast'],
  ['oat-cake','chicken-rice','skyr-banana','salmon-potato'],
  ['oat-cake','chicken-potato','greek-fruit','turkey-pasta'],
  ['oat-cake','chicken-rice','skyr-bowl','chickpea-tuna'],
  ['oat-cake','lentil-chicken','skyr-banana','salmon-potato'],
  ['oat-cake','chicken-potato','greek-fruit','turkey-wrap'],
  ['oat-cake','turkey-pasta','skyr-bowl','salmon-potato'],
  ['oat-cake','chicken-rice','skyr-banana','tuna-toast'],
  ['oat-cake','chicken-potato','greek-fruit','salmon-potato'],
  ['oat-cake','turkey-pasta','skyr-bowl','chicken-rice'],
  ['oat-cake','chicken-potato','skyr-banana','chickpea-tuna'],
  ['oat-cake','chicken-rice','greek-fruit','salmon-potato'],
  ['oat-cake','lentil-chicken','skyr-bowl','turkey-wrap'],
  ['oat-cake','chicken-potato','skyr-banana','salmon-potato'],
  ['oat-cake','chicken-rice','greek-fruit','turkey-pasta'],
  ['oat-cake','chicken-potato','skyr-bowl','tuna-toast'],
  ['oat-cake','chicken-rice','skyr-banana','salmon-potato'],
  ['oat-cake','turkey-pasta','greek-fruit','chickpea-tuna'],
  ['oat-cake','chicken-potato','skyr-bowl','salmon-potato'],
  ['oat-cake','chicken-rice','skyr-banana','turkey-wrap'],
  ['oat-cake','lentil-chicken','greek-fruit','salmon-potato'],
  ['oat-cake','chicken-rice','skyr-bowl','tuna-toast'],
  ['oat-cake','chicken-potato','skyr-banana','salmon-potato'],
  ['oat-cake','turkey-pasta','greek-fruit','chicken-rice'],
];

function templateForDay(dayIndex: number): string[] {
  return [...MONTH_TEMPLATE[dayIndex % MONTH_TEMPLATE.length]];
}

export function generateMonth(target: MacroVector, days = 30): MonthlyNutritionDay[] {
  if (!Number.isInteger(days) || days < 1 || days > 31) throw new Error('Nutrition plan length must be between 1 and 31 days.');
  if (!Number.isFinite(target.kcal) || target.kcal < 1000) throw new Error('Daily nutrition target is not valid.');
  return Array.from({ length: days }, (_, index) => {
    const recipeIds = templateForDay(index);
    const initial: PlannedNutritionDay = { meals: recipeIds.map((recipeId) => ({ recipeId, scale: 1 })) };
    const plan = optimizeDay(initial, CORE_RECIPES, CORE_INGREDIENTS, target, { minScale: 0.6, maxScale: 1.6, iterations: 260 });
    return { day: index + 1, week: Math.floor(index / 7) + 1, plan, macros: dayMacros(plan, CORE_RECIPES, CORE_INGREDIENTS) };
  });
}
