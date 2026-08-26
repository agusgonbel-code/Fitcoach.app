import type { IngredientDefinition, MacroVector, RecipeDefinition } from './recipePlanner';
import { recipeMacros } from './recipePlanner';

export interface MealSwapCandidate {
  recipe: RecipeDefinition;
  scale: number;
  macros: MacroVector;
  kcalDeltaPct: number;
  proteinDeltaG: number;
}

export function findMealSwap(
  currentRecipeId: string,
  currentScale: number,
  recipes: RecipeDefinition[],
  ingredients: IngredientDefinition[],
  options: { maxKcalPct?: number; maxProteinG?: number } = {},
): MealSwapCandidate | null {
  const maxKcalPct = options.maxKcalPct ?? 0.12;
  const maxProteinG = options.maxProteinG ?? 12;
  const current = recipes.find((recipe) => recipe.id === currentRecipeId);
  if (!current) throw new Error(`Unknown current recipe: ${currentRecipeId}`);
  const target = recipeMacros(current, ingredients, currentScale);
  let best: MealSwapCandidate | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const recipe of recipes) {
    if (recipe.id === currentRecipeId) continue;
    for (let scale = 0.55; scale <= 1.65 + 1e-9; scale += 0.05) {
      const roundedScale = Number(scale.toFixed(2));
      const macros = recipeMacros(recipe, ingredients, roundedScale);
      const kcalDeltaPct = Math.abs(macros.kcal - target.kcal) / Math.max(1, target.kcal);
      const proteinDeltaG = Math.abs(macros.proteinG - target.proteinG);
      if (kcalDeltaPct > maxKcalPct || proteinDeltaG > maxProteinG) continue;
      const score = kcalDeltaPct * 2 + proteinDeltaG / Math.max(20, target.proteinG);
      if (score < bestScore) {
        bestScore = score;
        best = { recipe, scale: roundedScale, macros, kcalDeltaPct, proteinDeltaG };
      }
    }
  }
  return best;
}
