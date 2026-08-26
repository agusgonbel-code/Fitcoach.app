import { describe, expect, it } from 'vitest';
import { generateMonth } from '../domain/nutrition/monthlyPlanner';
import { generateWeek } from '../domain/nutrition/weeklyPlanner';
import {
  nutritionPlanStorageKey,
  readNutritionPlan,
  writeNutritionPlan,
  type PersistedNutritionPlan,
} from './nutritionPlanRepository';

const target = { kcal: 2400, proteinG: 165, carbsG: 300, fatG: 60 };

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
  removeItem(key: string) { this.data.delete(key); }
}

function state(): PersistedNutritionPlan {
  return {
    version: 1,
    profileId: 'profile-1',
    target,
    week: generateWeek(target),
    month: generateMonth(target),
    overrides: {
      'month-4-1': { recipeId: 'chicken-potato', scale: 1.1 },
    },
    horizon: 'month',
    selectedDay: 4,
    updatedAt: '2026-08-27T00:00:00.000Z',
  };
}

describe('nutritionPlanRepository', () => {
  it('restores a complete plan and meal substitutions', () => {
    const storage = new MemoryStorage();
    const original = state();
    writeNutritionPlan(storage, original);
    const restored = readNutritionPlan(storage, 'profile-1', target);
    expect(restored).toEqual(original);
    expect(restored?.overrides['month-4-1']).toEqual({ recipeId: 'chicken-potato', scale: 1.1 });
    expect(restored?.horizon).toBe('month');
    expect(restored?.selectedDay).toBe(4);
  });

  it('invalidates a saved plan when the nutrition target changes', () => {
    const storage = new MemoryStorage();
    writeNutritionPlan(storage, state());
    expect(readNutritionPlan(storage, 'profile-1', { ...target, kcal: 2200 })).toBeNull();
  });

  it('never restores one profile plan into a different profile', () => {
    const storage = new MemoryStorage();
    writeNutritionPlan(storage, state());
    expect(readNutritionPlan(storage, 'profile-2', target)).toBeNull();
  });

  it('rejects corrupt or out-of-range persisted UI state', () => {
    const storage = new MemoryStorage();
    const broken = { ...state(), horizon: 'week', selectedDay: 30 };
    storage.setItem(nutritionPlanStorageKey(), JSON.stringify(broken));
    expect(readNutritionPlan(storage, 'profile-1', target)).toBeNull();
  });

  it('refuses to write invalid substitution scales', () => {
    const storage = new MemoryStorage();
    const broken = state();
    broken.overrides = { 'month-1-0': { recipeId: 'oat-cake', scale: 3 } };
    expect(() => writeNutritionPlan(storage, broken)).toThrow('El plan nutricional no es válido');
  });
});
