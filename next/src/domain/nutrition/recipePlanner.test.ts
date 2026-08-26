import { describe, expect, it } from 'vitest';
import { dayMacros, ingredientMacros, optimizeDay, recipeMacros, validateDay, type IngredientDefinition, type RecipeDefinition } from './recipePlanner';

const ingredients: IngredientDefinition[] = [
  { id: 'chicken', name: 'Pechuga de pollo', kcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6 },
  { id: 'rice', name: 'Arroz cocido', kcal: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3 },
  { id: 'oil', name: 'Aceite de oliva', kcal: 884, proteinG: 0, carbsG: 0, fatG: 100 },
];

const recipes: RecipeDefinition[] = [
  { id: 'meal', name: 'Pollo con arroz', ingredients: [
    { ingredientId: 'chicken', grams: 180 },
    { ingredientId: 'rice', grams: 260 },
    { ingredientId: 'oil', grams: 10 },
  ] },
];

describe('recipePlanner', () => {
  it('derives macros from the visible ingredient grams', () => {
    expect(ingredientMacros(ingredients[0], 180)).toEqual({ kcal: 297, proteinG: 55.8, carbsG: 0, fatG: 6.48 });
    expect(recipeMacros(recipes[0], ingredients)).toEqual({ kcal: 723.4, proteinG: 62.8, carbsG: 72.8, fatG: 17.3 });
  });

  it('scales recipe quantities without inventing macro values', () => {
    expect(recipeMacros(recipes[0], ingredients, 0.5)).toEqual({ kcal: 361.7, proteinG: 31.4, carbsG: 36.4, fatG: 8.6 });
  });

  it('rejects unknown ingredients instead of silently returning zero', () => {
    expect(() => recipeMacros({ id: 'bad', name: 'Bad', ingredients: [{ ingredientId: 'missing', grams: 100 }] }, ingredients)).toThrow('Unknown ingredient');
  });

  it('optimizes portions toward a target while keeping scales bounded', () => {
    const initial = { meals: [{ recipeId: 'meal', scale: 1 }, { recipeId: 'meal', scale: 1 }] };
    const target = { kcal: 1500, proteinG: 130, carbsG: 150, fatG: 36 };
    const before = dayMacros(initial, recipes, ingredients);
    const optimized = optimizeDay(initial, recipes, ingredients, target);
    const after = dayMacros(optimized, recipes, ingredients);
    expect(Math.abs(after.kcal - target.kcal)).toBeLessThanOrEqual(Math.abs(before.kcal - target.kcal));
    expect(optimized.meals.every((meal) => meal.scale >= 0.55 && meal.scale <= 1.65)).toBe(true);
  });

  it('validates daily tolerances from calculated macros', () => {
    const day = { meals: [{ recipeId: 'meal', scale: 1 }, { recipeId: 'meal', scale: 1 }] };
    const actual = dayMacros(day, recipes, ingredients);
    expect(validateDay(day, recipes, ingredients, actual).valid).toBe(true);
    expect(validateDay(day, recipes, ingredients, { ...actual, proteinG: actual.proteinG + 20 }).valid).toBe(false);
  });
});
