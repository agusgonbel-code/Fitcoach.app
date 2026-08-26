import { describe, expect, it } from 'vitest';
import { CORE_INGREDIENTS, CORE_RECIPES } from './library';
import { dayMacros } from './recipePlanner';
import { generateWeek } from './weeklyPlanner';

const target = { kcal: 2400, proteinG: 165, carbsG: 300, fatG: 60 };

describe('weeklyPlanner', () => {
  it('generates seven days from real recipe ids and bounded portions', () => {
    const week = generateWeek(target);
    const knownRecipes = new Set(CORE_RECIPES.map((recipe) => recipe.id));
    expect(week).toHaveLength(7);
    for (const day of week) {
      expect(day.plan.meals).toHaveLength(4);
      expect(day.plan.meals.every((meal) => knownRecipes.has(meal.recipeId))).toBe(true);
      expect(day.plan.meals.every((meal) => meal.scale >= 0.6 && meal.scale <= 1.6)).toBe(true);
      expect(day.macros).toEqual(dayMacros(day.plan, CORE_RECIPES, CORE_INGREDIENTS));
    }
  });

  it('does not repeat exactly the same recipe sequence every day', () => {
    const signatures = generateWeek(target).map((day) => day.plan.meals.map((meal) => meal.recipeId).join('|'));
    expect(new Set(signatures).size).toBeGreaterThan(3);
  });

  it('rejects impossible daily targets', () => {
    expect(() => generateWeek({ ...target, kcal: 0 })).toThrow('Daily nutrition target is not valid');
  });
});
