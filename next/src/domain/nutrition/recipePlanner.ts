export interface MacroVector {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface IngredientDefinition extends MacroVector {
  id: string;
  name: string;
}

export interface RecipeIngredient {
  ingredientId: string;
  grams: number;
}

export interface RecipeDefinition {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
}

export interface PlannedMeal {
  recipeId: string;
  scale: number;
}

export interface PlannedNutritionDay {
  meals: PlannedMeal[];
}

export interface NutritionTolerance {
  kcalPct: number;
  proteinG: number;
  fatG: number;
}

const ZERO: MacroVector = { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 };
const round = (value: number, digits = 1) => Number(value.toFixed(digits));
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function ingredientMacros(ingredient: IngredientDefinition, grams: number): MacroVector {
  if (!Number.isFinite(grams) || grams < 0) throw new Error('Ingredient grams must be a non-negative number.');
  const factor = grams / 100;
  return {
    kcal: round(ingredient.kcal * factor, 2),
    proteinG: round(ingredient.proteinG * factor, 2),
    carbsG: round(ingredient.carbsG * factor, 2),
    fatG: round(ingredient.fatG * factor, 2),
  };
}

export function recipeMacros(recipe: RecipeDefinition, ingredients: IngredientDefinition[], scale = 1): MacroVector {
  if (!Number.isFinite(scale) || scale <= 0) throw new Error('Recipe scale must be greater than zero.');
  const byId = new Map(ingredients.map((item) => [item.id, item]));
  const total = recipe.ingredients.reduce<MacroVector>((sum, item) => {
    const ingredient = byId.get(item.ingredientId);
    if (!ingredient) throw new Error(`Unknown ingredient: ${item.ingredientId}`);
    const macros = ingredientMacros(ingredient, item.grams * scale);
    return {
      kcal: sum.kcal + macros.kcal,
      proteinG: sum.proteinG + macros.proteinG,
      carbsG: sum.carbsG + macros.carbsG,
      fatG: sum.fatG + macros.fatG,
    };
  }, { ...ZERO });
  return {
    kcal: round(total.kcal),
    proteinG: round(total.proteinG),
    carbsG: round(total.carbsG),
    fatG: round(total.fatG),
  };
}

export function dayMacros(day: PlannedNutritionDay, recipes: RecipeDefinition[], ingredients: IngredientDefinition[]): MacroVector {
  const byId = new Map(recipes.map((item) => [item.id, item]));
  const total = day.meals.reduce<MacroVector>((sum, meal) => {
    const recipe = byId.get(meal.recipeId);
    if (!recipe) throw new Error(`Unknown recipe: ${meal.recipeId}`);
    const macros = recipeMacros(recipe, ingredients, meal.scale);
    return {
      kcal: sum.kcal + macros.kcal,
      proteinG: sum.proteinG + macros.proteinG,
      carbsG: sum.carbsG + macros.carbsG,
      fatG: sum.fatG + macros.fatG,
    };
  }, { ...ZERO });
  return {
    kcal: round(total.kcal),
    proteinG: round(total.proteinG),
    carbsG: round(total.carbsG),
    fatG: round(total.fatG),
  };
}

function score(actual: MacroVector, target: MacroVector): number {
  const kcal = Math.abs(actual.kcal - target.kcal) / Math.max(1, target.kcal);
  const protein = Math.abs(actual.proteinG - target.proteinG) / Math.max(20, target.proteinG);
  const fat = Math.abs(actual.fatG - target.fatG) / Math.max(15, target.fatG);
  return kcal * 2 + protein * 1.35 + fat * 0.2;
}

export function optimizeDay(
  day: PlannedNutritionDay,
  recipes: RecipeDefinition[],
  ingredients: IngredientDefinition[],
  target: MacroVector,
  options: { minScale?: number; maxScale?: number; iterations?: number } = {},
): PlannedNutritionDay {
  const minScale = options.minScale ?? 0.55;
  const maxScale = options.maxScale ?? 1.65;
  const iterations = options.iterations ?? 180;
  const output: PlannedNutritionDay = {
    meals: day.meals.map((meal) => ({ ...meal, scale: clamp(meal.scale || 1, minScale, maxScale) })),
  };
  if (!output.meals.length) return output;

  let best = score(dayMacros(output, recipes, ingredients), target);
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    let improved = false;
    for (let index = 0; index < output.meals.length; index += 1) {
      const base = output.meals[index].scale;
      for (const delta of [-0.08, -0.04, -0.02, 0.02, 0.04, 0.08]) {
        const candidate = clamp(base + delta, minScale, maxScale);
        output.meals[index].scale = candidate;
        const candidateScore = score(dayMacros(output, recipes, ingredients), target);
        if (candidateScore + 1e-9 < best) {
          best = candidateScore;
          improved = true;
        } else {
          output.meals[index].scale = base;
        }
      }
    }
    if (!improved) break;
  }
  return { meals: output.meals.map((meal) => ({ ...meal, scale: round(meal.scale, 3) })) };
}

export function validateDay(
  day: PlannedNutritionDay,
  recipes: RecipeDefinition[],
  ingredients: IngredientDefinition[],
  target: MacroVector,
  tolerance: NutritionTolerance = { kcalPct: 0.03, proteinG: 5, fatG: 5 },
) {
  const actual = dayMacros(day, recipes, ingredients);
  const errors = {
    kcal: round(actual.kcal - target.kcal),
    proteinG: round(actual.proteinG - target.proteinG),
    carbsG: round(actual.carbsG - target.carbsG),
    fatG: round(actual.fatG - target.fatG),
  };
  const valid = Math.abs(errors.kcal) <= Math.max(35, target.kcal * tolerance.kcalPct)
    && Math.abs(errors.proteinG) <= tolerance.proteinG
    && Math.abs(errors.fatG) <= tolerance.fatG;
  return { valid, actual, errors };
}
