import { describe, expect, it } from 'vitest';
import { CORE_INGREDIENTS, CORE_RECIPES } from './library';
import { findMealSwap } from './mealSwap';
import { recipeMacros } from './recipePlanner';

describe('findMealSwap', () => {
  it('returns a different recipe within kcal and protein tolerances', () => {
    const current = CORE_RECIPES.find((recipe) => recipe.id === 'chicken-rice')!;
    const currentMacros = recipeMacros(current, CORE_INGREDIENTS, 1);
    const swap = findMealSwap('chicken-rice', 1, CORE_RECIPES, CORE_INGREDIENTS);

    expect(swap).not.toBeNull();
    expect(swap?.recipe.id).not.toBe('chicken-rice');
    expect(swap?.kcalDeltaPct).toBeLessThanOrEqual(0.12);
    expect(swap?.proteinDeltaG).toBeLessThanOrEqual(12);
    expect(Math.abs((swap?.macros.kcal ?? 0) - currentMacros.kcal)).toBeLessThanOrEqual(currentMacros.kcal * 0.12);
  });

  it('returns null when tolerances make a valid replacement impossible', () => {
    const swap = findMealSwap('whey-banana', 1, CORE_RECIPES, CORE_INGREDIENTS, { maxKcalPct: 0, maxProteinG: 0 });
    expect(swap).toBeNull();
  });

  it('rejects an unknown current recipe', () => {
    expect(() => findMealSwap('missing', 1, CORE_RECIPES, CORE_INGREDIENTS)).toThrow('Unknown current recipe');
  });
});
