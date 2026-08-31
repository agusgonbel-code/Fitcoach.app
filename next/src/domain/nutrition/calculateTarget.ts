import type { NutritionCalculation, UserProfile } from '../models';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Evidence-informed defaults for generally healthy adults who train with resistance.
 * These are starting targets, not medical prescriptions. Real-world intake should be
 * adjusted from weight trend, training performance, hunger, recovery and adherence.
 */
export function calculateNutrition(profile: UserProfile): NutritionCalculation {
  if (!Number.isFinite(profile.weightKg) || profile.weightKg <= 0) throw new Error('Peso no válido.');
  if (!Number.isFinite(profile.heightCm) || profile.heightCm <= 0) throw new Error('Altura no válida.');
  if (!Number.isFinite(profile.age) || profile.age < 14 || profile.age > 100) throw new Error('Edad no válida.');

  const sexOffset = profile.sex === 'male' ? 5 : -161;
  const bmr = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + sexOffset;
  const activity = clamp(profile.activityMultiplier || 1.45, 1.2, 2.1);
  const tdee = bmr * activity;

  // Conservative starting points. Recomposition begins at estimated maintenance;
  // hypertrophy uses a small surplus and fat loss a moderate deficit.
  const adjustmentPct = profile.goal === 'fatloss' ? -0.15
    : profile.goal === 'hypertrophy' ? 0.06
    : profile.goal === 'strength' ? 0.03
    : 0;

  const kcal = Math.round(tdee * (1 + adjustmentPct));

  // Sports-nutrition consensus generally supports ~1.4–2.0 g/kg/day for active adults.
  // We bias toward the upper end during an energy deficit and for hypertrophy.
  const proteinPerKg = profile.goal === 'fatloss' ? 2.0
    : profile.goal === 'hypertrophy' ? 1.8
    : profile.goal === 'strength' ? 1.7
    : 1.8;
  const proteinG = Math.round(profile.weightKg * proteinPerKg);

  // Keep total fat in a practical healthy range while avoiding an unnecessarily low intake.
  // Start near 25% of energy, bounded to 0.8–1.2 g/kg and an absolute 45 g floor.
  const fatFromEnergy = (kcal * 0.25) / 9;
  const fatLower = Math.max(45, profile.weightKg * 0.8);
  const fatUpper = Math.max(fatLower, profile.weightKg * 1.2);
  const fatG = Math.round(clamp(fatFromEnergy, fatLower, fatUpper));

  // Carbohydrate receives the remaining energy so training fuel scales with total energy needs.
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
