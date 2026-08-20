import assert from 'node:assert/strict';

await import('../nutrition-log-v347.js');
const { createMealEntry, appendMeal, migrateMeals, updateMeal, removeMeal } = globalThis.FitCoachNutritionLog;

const recipe = {
  id: 'r-1', name: 'Pollo con arroz',
  n: { kcal: 640.4, p: 48.2, c: 72.6, f: 16.3 }
};
const entry = createMealEntry({
  date: '2026-08-14', recipe, scale: 1.25, plannedDay: 2, mealIndex: 1
});
assert.match(entry.mealId, /^[A-Za-z0-9_-]{1,128}$/);
assert.deepEqual({ ...entry, mealId: '<id>' }, {
  mealId: '<id>',
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

let sequence = 0;
const legacy = migrateMeals([
  { date: '2026-08-14', name: 'Antigua', kcal: 500, protein: 30, carbs: 60, fat: 15 },
  { mealId: 'kept-id', date: '2026-08-14', name: 'Con ID', kcal: 300, protein: 20, carbs: 35, fat: 8 },
  { mealId: 'kept-id', date: '2026-08-13', name: 'ID repetido', kcal: 200, protein: 10, carbs: 20, fat: 7 }
], () => `migrated-${++sequence}`);
assert.equal(legacy.changed, true);
assert.deepEqual(legacy.meals.map(meal => meal.mealId), ['migrated-1', 'kept-id', 'migrated-2']);

const edited = updateMeal(legacy.meals, 'migrated-1', {
  name: '  Pollo corregido  ', kcal: 555.4, protein: 42.7, carbs: 61.2, fat: 14.9
});
assert.equal(edited.updated, true);
assert.deepEqual(
  Object.fromEntries(['name', 'kcal', 'protein', 'carbs', 'fat'].map(key => [key, edited.meals[0][key]])),
  { name: 'Pollo corregido', kcal: 555, protein: 43, carbs: 61, fat: 15 }
);
assert.equal(edited.meals[0].date, '2026-08-14', 'Editar no debe mover la comida de fecha');
assert.match(edited.meals[0].editedAt, /^\d{4}-\d{2}-\d{2}T/);

const removed = removeMeal(edited.meals, 'migrated-1');
assert.equal(removed.removed, true);
assert.equal(removed.meals.length, 2);
assert.equal(removeMeal(removed.meals, 'migrated-1').removed, false);

assert.throws(() => createMealEntry({ date: '14/08/2026', recipe }), /Fecha no válida/);
assert.throws(() => createMealEntry({ date: '2026-08-14', recipe, scale: 0 }), /Porción fuera/);
assert.throws(() => appendMeal({}, entry), /Diario no válido/);
assert.throws(() => updateMeal(legacy.meals, 'migrated-1', { name: '', kcal: 1, protein: 1, carbs: 1, fat: 1 }), /Nombre/);
assert.throws(() => updateMeal(legacy.meals, 'migrated-1', { name: 'Error', kcal: 6000, protein: 1, carbs: 1, fat: 1 }), /rango/);
assert.throws(() => removeMeal(legacy.meals, '../unsafe'), /Identificador/);
