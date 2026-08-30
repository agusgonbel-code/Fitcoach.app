import { describe, expect, it } from 'vitest';
import { defaultMealTimes, normalizeNutritionPreferences, readNutritionPreferences, writeNutritionPreferences } from './nutritionPreferencesRepository';

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe('nutritionPreferencesRepository', () => {
  it('normalizes meal count and meal times together', () => {
    const value = normalizeNutritionPreferences({ mealsPerDay: 9, mealTimes: ['08:00'] }, 'u1');
    expect(value.mealsPerDay).toBe(6);
    expect(value.mealTimes).toEqual(defaultMealTimes(6));
  });

  it('persists preferences per profile', () => {
    const storage = new MemoryStorage();
    const saved = writeNutritionPreferences(storage, normalizeNutritionPreferences({ mealsPerDay: 5, dietStyle: 'vegetarian', trainingTime: '06:00' }, 'u1'));
    expect(readNutritionPreferences(storage, 'u1')).toMatchObject({ mealsPerDay: 5, dietStyle: 'vegetarian', trainingTime: '06:00' });
    expect(readNutritionPreferences(storage, 'u2').profileId).toBe('u2');
    expect(saved.mealTimes).toHaveLength(5);
  });
});
