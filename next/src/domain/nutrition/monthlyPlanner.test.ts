import { describe, expect, it } from 'vitest';
import { CORE_INGREDIENTS, CORE_RECIPES } from './library';
import { generateMonth } from './monthlyPlanner';
import { dayMacros } from './recipePlanner';

const target = { kcal: 2400, proteinG: 165, carbsG: 300, fatG: 60 };

describe('monthlyPlanner', () => {
  it('generates 30 complete days from real recipes and bounded portions', () => {
    const month = generateMonth(target);
    const knownRecipes = new Set(CORE_RECIPES.map((recipe) => recipe.id));
    expect(month).toHaveLength(30);
    expect(month.at(-1)?.week).toBe(5);
    for (const day of month) {
      expect(day.plan.meals).toHaveLength(4);
      expect(day.plan.meals.every((meal) => knownRecipes.has(meal.recipeId))).toBe(true);
      expect(day.plan.meals.every((meal) => meal.scale >= 0.6 && meal.scale <= 1.6)).toBe(true);
      expect(day.macros).toEqual(dayMacros(day.plan, CORE_RECIPES, CORE_INGREDIENTS));
    }
  });

  it('rotates meal order across weeks instead of cloning the same seven-day sequence', () => {
    const month = generateMonth(target);
    const dayOne = month[0].plan.meals.map((meal) => meal.recipeId).join('|');
    const dayEight = month[7].plan.meals.map((meal) => meal.recipeId).join('|');
    expect(dayEight).not.toBe(dayOne);
  });

  it('supports a shorter requested horizon and rejects invalid lengths', () => {
    expect(generateMonth(target, 14)).toHaveLength(14);
    expect(() => generateMonth(target, 0)).toThrow('Nutrition plan length must be between 1 and 31 days');
    expect(() => generateMonth(target, 32)).toThrow('Nutrition plan length must be between 1 and 31 days');
  });
});
