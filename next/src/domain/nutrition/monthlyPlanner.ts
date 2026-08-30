import { CORE_INGREDIENTS, CORE_RECIPES } from './library';
import { dayMacros, optimizeDay, type MacroVector, type PlannedNutritionDay } from './recipePlanner';

export interface MonthlyNutritionDay {
  day: number;
  week: number;
  plan: PlannedNutritionDay;
  macros: MacroVector;
}

const BASE_TEMPLATES = [
  ['oat-cake', 'chicken-rice', 'skyr-bowl', 'turkey-wrap', 'greek-fruit'],
  ['skyr-bowl', 'salmon-potato', 'cottage-toast', 'lentil-chicken', 'whey-banana'],
  ['oat-cake', 'turkey-pasta', 'greek-fruit', 'chickpea-tuna', 'skyr-banana'],
  ['skyr-bowl', 'chicken-potato', 'whey-banana', 'turkey-wrap', 'cottage-toast'],
  ['oat-cake', 'lentil-chicken', 'skyr-banana', 'salmon-potato', 'greek-fruit'],
  ['cottage-toast', 'chickpea-tuna', 'skyr-bowl', 'turkey-pasta', 'whey-banana'],
  ['oat-cake', 'chicken-rice', 'greek-fruit', 'tuna-toast', 'skyr-banana'],
];

function rotatedTemplate(dayIndex: number): string[] {
  const weekIndex = Math.floor(dayIndex / 7);
  const base = BASE_TEMPLATES[dayIndex % BASE_TEMPLATES.length];
  const rotation = weekIndex % base.length;
  if (rotation === 0) return [...base];
  return [...base.slice(rotation), ...base.slice(0, rotation)];
}

export function generateMonth(target: MacroVector, days = 30): MonthlyNutritionDay[] {
  if (!Number.isInteger(days) || days < 1 || days > 31) throw new Error('Nutrition plan length must be between 1 and 31 days.');
  if (!Number.isFinite(target.kcal) || target.kcal < 1000) throw new Error('Daily nutrition target is not valid.');

  return Array.from({ length: days }, (_, index) => {
    const recipeIds = rotatedTemplate(index);
    const initial: PlannedNutritionDay = { meals: recipeIds.map((recipeId) => ({ recipeId, scale: 1 })) };
    const plan = optimizeDay(initial, CORE_RECIPES, CORE_INGREDIENTS, target, { minScale: 0.55, maxScale: 1.7, iterations: 280 });
    return {
      day: index + 1,
      week: Math.floor(index / 7) + 1,
      plan,
      macros: dayMacros(plan, CORE_RECIPES, CORE_INGREDIENTS),
    };
  });
}
