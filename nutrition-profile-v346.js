(() => {
  'use strict';

  const STORAGE_KEY = 'fitcoach_nutrition_profile_v34';
  const DEFAULT_PROFILE = Object.freeze({
    sex: 'm', age: 46, height: 181, weight: 81, bodyFat: 22,
    activity: 1.6, goal: 'recomp', equation: 'mifflin'
  });
  const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

  function normalizeProfile(value = {}) {
    return {
      sex: value.sex === 'f' ? 'f' : 'm',
      age: clamp(Math.round(finite(value.age, DEFAULT_PROFILE.age)), 14, 100),
      height: clamp(finite(value.height, DEFAULT_PROFILE.height), 120, 230),
      weight: clamp(finite(value.weight, DEFAULT_PROFILE.weight), 35, 350),
      bodyFat: clamp(finite(value.bodyFat, DEFAULT_PROFILE.bodyFat), 3, 70),
      activity: [1.3, 1.45, 1.6, 1.75].includes(finite(value.activity, 0)) ? finite(value.activity, 0) : DEFAULT_PROFILE.activity,
      goal: ['loss', 'maintain', 'gain', 'recomp'].includes(value.goal) ? value.goal : DEFAULT_PROFILE.goal,
      equation: ['mifflin', 'katch'].includes(value.equation) ? value.equation : DEFAULT_PROFILE.equation
    };
  }

  function calculateTargets(value) {
    const profile = normalizeProfile(value);
    const mifflinSex = profile.sex === 'f' ? -161 : 5;
    const bmr = profile.equation === 'katch'
      ? 370 + 21.6 * profile.weight * (1 - profile.bodyFat / 100)
      : 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + mifflinSex;
    const maintenance = bmr * profile.activity;
    const kcal = Math.round(maintenance * ({ loss: .82, maintain: 1, gain: 1.08, recomp: .95 })[profile.goal]);
    const protein = Math.round(profile.weight * (profile.goal === 'loss' ? 2.2 : 2));
    const fat = Math.round(profile.weight * .9);
    const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
    return { profile, targets: { kcal, protein, carbs, fat }, maintenance: Math.round(maintenance) };
  }

  globalThis.FitCoachNutritionProfile = { STORAGE_KEY, DEFAULT_PROFILE, normalizeProfile, calculateTargets };
})();