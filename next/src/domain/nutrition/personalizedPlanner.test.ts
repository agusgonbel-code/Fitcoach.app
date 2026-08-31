import { describe, expect, it } from 'vitest';
import { defaultNutritionPreferences } from '../../data/nutritionPreferencesRepository';
import { CORE_RECIPES } from './library';
import { eligibleRecipes, generatePersonalizedWeek, mealRelation } from './personalizedPlanner';

const target = { kcal: 2400, proteinG: 160, carbsG: 300, fatG: 62 };

describe('personalized nutrition planner', () => {
  it('respects the selected number of meals', () => {
    const preferences = { ...defaultNutritionPreferences('u1'), mealsPerDay: 3, mealTimes: ['08:00', '14:00', '21:00'] };
    const week = generatePersonalizedWeek(target, preferences);
    expect(week).toHaveLength(7);
    expect(week.every((day) => day.plan.meals.length === 3)).toBe(true);
  });

  it('removes animal ingredients for vegan plans', () => {
    const preferences = { ...defaultNutritionPreferences('u1'), dietStyle: 'vegan' as const };
    const allowed = eligibleRecipes(preferences);
    const forbidden = new Set(['chicken', 'turkey', 'salmon', 'tuna', 'egg', 'eggwhite', 'skyr', 'greek0', 'cottage', 'whey']);
    expect(allowed.length).toBeGreaterThan(0);
    expect(allowed.every((recipe) => recipe.ingredients.every((item) => !forbidden.has(item.ingredientId)))).toBe(true);
  });

  it('removes explicitly excluded ingredients', () => {
    const preferences = { ...defaultNutritionPreferences('u1'), excludedFoods: ['pollo'] };
    const allowedIds = new Set(eligibleRecipes(preferences).map((recipe) => recipe.id));
    expect(CORE_RECIPES.filter((recipe) => recipe.ingredients.some((item) => item.ingredientId === 'chicken')).every((recipe) => !allowedIds.has(recipe.id))).toBe(true);
  });

  it('identifies pre and post workout windows', () => {
    expect(mealRelation('05:00', '06:00')).toBe('pre');
    expect(mealRelation('07:00', '06:00')).toBe('post');
    expect(mealRelation('13:00', '06:00')).toBe('normal');
  });
});
