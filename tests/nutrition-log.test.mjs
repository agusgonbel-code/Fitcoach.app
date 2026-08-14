import assert from 'node:assert/strict';

await import('../nutrition-log-v347.js');
const { createMealEntry, appendMeal } = globalThis.FitCoachNutritionLog;

const recipe = {
  id: 'r-1', name: 'Pollo con arroz',
  n: { kcal: 640.4, p: 48.2, c: 72.6, f: 16.3 }
};
const entry = createMealEntry({
  date: '2026-08-14', recipe, scale: 1.25, plannedDay: 2, mealIndex: 1
});
assert.deepEqual(entry, {
  date: '2026-08-14', name: 'Pollo con arroz', kcal: 801, protein: 60,
  carbs: 91, fat: 20, recipeId: 'r-1', portionScale: 1.25,
  origin: 'monthly-menu', sourceId: 'v34menu:3:2:r-1:1.2500', plannedDay: 3, mealIndex: 2
});

const first = appendMeal([], entry);
assert.equal(first.added, true);
assert.equal(first.meals.length, 1);
const duplicate = appendMeal(first.meals, entry);
assert.equal(duplicate.added, false);
assert.equal(duplicate.meals.length, 1);

const libraryEntry = createMealEntry({ date: '2026-08-14', recipe, scale: 1 });
assert.equal(libraryEntry.origin, 'recipe-library');
assert.equal(Object.hasOwn(libraryEntry, 'sourceId'), false);
assert.equal(appendMeal([libraryEntry], libraryEntry).meals.length, 2);

assert.throws(() => createMealEntry({ date: '14/08/2026', recipe }), /Fecha no válida/);
assert.throws(() => createMealEntry({ date: '2026-08-14', recipe, scale: 0 }), /Porción fuera/);
assert.throws(() => appendMeal({}, entry), /Diario no válido/);
