import type { NutritionCalculation, UserProfile } from '../models';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function calculateNutrition(profile: UserProfile): NutritionCalculation {
  if (!Number.isFinite(profile.weightKg) || profile.weightKg <= 0) throw new Error('Peso no válido.');
  if (!Number.isFinite(profile.heightCm) || profile.heightCm <= 0) throw new Error('Altura no válida.');
  if (!Number.isFinite(profile.age) || profile.age < 14 || profile.age > 100) throw new Error('Edad no válida.');

  const sexOffset = profile.sex === 'male' ? 5 : -161;
  const bmr = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + sexOffset;
  const activity = clamp(profile.activityMultiplier || 1.45, 1.2, 2.1);
  const tdee = bmr * activity;

  const adjustmentPct = profile.goal === 'fatloss' ? -0.15
    : profile.goal === 'hypertrophy' ? 0.08
    : profile.goal === 'strength' ? 0.05
    : 0;

  const kcal = Math.round(tdee * (1 + adjustmentPct));
  const proteinPerKg = profile.goal === 'fatloss' ? 2.0 : 1.8;
  const proteinG = Math.round(profile.weightKg * proteinPerKg);
  const fatG = Math.round(Math.max(profile.weightKg * 0.8, 45));
  const remainingKcal = Math.max(0, kcal - proteinG * 4 - fatG * 9);
  const carbsG = Math.round(remainingKcal / 4);

  return {
    equation: 'mifflin-st-jeor',
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    adjustmentPct,
    target: { kcal, proteinG, carbsG, fatG }
  };
}
