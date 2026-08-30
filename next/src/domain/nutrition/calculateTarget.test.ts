import { describe, expect, it } from 'vitest';
import type { UserProfile } from '../models';
import { calculateNutrition } from './calculateTarget';

const base: UserProfile = {
  id: 'u1', name: 'Test', goal: 'recomp', experience: 'intermediate', sex: 'male', age: 40,
  heightCm: 180, weightKg: 80, activityMultiplier: 1.45, trainingDaysPerWeek: 4,
  sessionMinutes: 50, equipment: ['gym'], restrictions: []
};

describe('calculateNutrition', () => {
  it('returns deterministic Mifflin-St Jeor targets with balanced macros', () => {
    const result = calculateNutrition(base);
    expect(result.equation).toBe('mifflin-st-jeor');
    expect(result.bmr).toBe(1730);
    expect(result.tdee).toBe(2509);
    expect(result.target.kcal).toBe(2509);
    expect(result.target.proteinG).toBe(144);
    expect(result.target.fatG).toBe(70);
    expect(result.target.carbsG).toBe(326);
    expect(result.target.proteinG / base.weightKg).toBeCloseTo(1.8, 2);
  });

  it('applies a conservative deficit and high protein for fat loss', () => {
    const result = calculateNutrition({ ...base, goal: 'fatloss' });
    expect(result.adjustmentPct).toBe(-0.15);
    expect(result.target.kcal).toBeLessThan(calculateNutrition(base).target.kcal);
    expect(result.target.proteinG).toBe(160);
    expect(result.target.fatG).toBeGreaterThanOrEqual(Math.round(base.weightKg * 0.8));
    expect(result.target.carbsG).toBeGreaterThan(0);
  });

  it('uses a small surplus for hypertrophy rather than aggressive bulking', () => {
    const result = calculateNutrition({ ...base, goal: 'hypertrophy' });
    expect(result.adjustmentPct).toBe(0.06);
    expect(result.target.proteinG).toBe(144);
    expect(result.target.kcal).toBeGreaterThan(result.tdee);
  });

  it('rejects invalid anthropometrics', () => {
    expect(() => calculateNutrition({ ...base, weightKg: 0 })).toThrow();
  });
});
