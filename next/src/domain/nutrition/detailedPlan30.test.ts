import { describe, expect, it } from 'vitest';
import { DETAILED_30_DAY_PLAN } from './detailedPlan30';

describe('detailed 30 day nutrition plan', () => {
  it('contains exactly 30 days with five meals per day', () => {
    expect(DETAILED_30_DAY_PLAN).toHaveLength(30);
    for (const day of DETAILED_30_DAY_PLAN) expect(day.meals).toHaveLength(5);
  });

  it('keeps complete nutritional detail for every known meal value', () => {
    for (const day of DETAILED_30_DAY_PLAN) {
      for (const meal of day.meals) {
        expect(meal.name.length).toBeGreaterThan(0);
        expect(meal.ingredients.length).toBeGreaterThan(0);
        expect(meal.nutrition.kcal).toBeGreaterThan(0);
        expect(meal.nutrition.proteinG).toBeGreaterThan(0);
        if (meal.slot !== 'Postentreno - Batido') {
          expect(meal.nutrition.carbsG).not.toBeNull();
          expect(meal.nutrition.fatG).not.toBeNull();
          expect(meal.nutrition.fiberG).not.toBeNull();
          expect(meal.nutrition.sugarsG).not.toBeNull();
          expect(meal.nutrition.saturatedFatG).not.toBeNull();
          expect(meal.nutrition.sodiumMg).not.toBeNull();
        }
      }
    }
  });

  it('does not invent unknown shake nutrients', () => {
    for (const day of DETAILED_30_DAY_PLAN) {
      const shake = day.meals.find((meal) => meal.slot === 'Postentreno - Batido');
      expect(shake).toBeDefined();
      expect(shake?.nutrition.kcal).toBe(120);
      expect(shake?.nutrition.proteinG).toBe(20);
      expect(shake?.nutrition.carbsG).toBeNull();
      expect(shake?.nutrition.fatG).toBeNull();
    }
  });
});
