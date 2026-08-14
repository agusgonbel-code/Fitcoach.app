import assert from 'node:assert/strict';
await import('../nutrition-profile-v346.js');

const { STORAGE_KEY, DEFAULT_PROFILE, normalizeProfile, calculateTargets } = globalThis.FitCoachNutritionProfile;

assert.equal(STORAGE_KEY, 'fitcoach_nutrition_profile_v34');
assert.equal(Object.isFrozen(DEFAULT_PROFILE), true);

const profile = normalizeProfile({
  sex: 'f', age: '38', height: '165', weight: '64.5', bodyFat: '26',
  activity: '1.45', goal: 'recomp', equation: 'katch'
});
assert.deepEqual(profile, {
  sex: 'f', age: 38, height: 165, weight: 64.5, bodyFat: 26,
  activity: 1.45, goal: 'recomp', equation: 'katch'
});

const result = calculateTargets(profile);
assert.equal(result.profile.sex, 'f');
assert.ok(result.maintenance > 1500 && result.maintenance < 3000);
assert.ok(result.targets.kcal > 1400);
assert.ok(result.targets.protein >= 120);
assert.ok(result.targets.carbs >= 0);

assert.deepEqual(normalizeProfile({ age: 999, weight: -3, activity: 9, goal: 'invalid' }), {
  sex: 'm', age: 100, height: 181, weight: 35, bodyFat: 22,
  activity: 1.6, goal: 'recomp', equation: 'mifflin'
});

console.log('Nutrition profile tests passed');
