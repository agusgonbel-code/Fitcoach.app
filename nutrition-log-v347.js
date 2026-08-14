(() => {
  'use strict';

  const fail = message => { throw new Error(message); };
  const finite = (value, label) => {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) fail(`${label} no válido`);
    return number;
  };

  function createMealEntry({ date, recipe, scale = 1, plannedDay = null, mealIndex = null }) {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) fail('Fecha no válida');
    if (!recipe || typeof recipe.id !== 'string' || !recipe.id || typeof recipe.name !== 'string' || !recipe.name.trim()) {
      fail('Receta no válida');
    }
    const factor = finite(scale, 'Porción');
    if (factor < 0.25 || factor > 4) fail('Porción fuera del rango permitido');
    const macros = recipe.n || recipe.macros;
    if (!macros) fail('La receta no contiene macros');
    const day = Number.isInteger(plannedDay) && plannedDay >= 0 && plannedDay < 30 ? plannedDay : null;
    const slot = Number.isInteger(mealIndex) && mealIndex >= 0 && mealIndex < 8 ? mealIndex : null;
    const sourceId = day === null || slot === null
      ? null
      : `v34menu:${day + 1}:${slot + 1}:${recipe.id}:${factor.toFixed(4)}`;
    return {
      date,
      name: recipe.name.trim().slice(0, 160),
      kcal: Math.round(finite(macros.kcal, 'Calorías') * factor),
      protein: Math.round(finite(macros.p ?? macros.protein, 'Proteína') * factor),
      carbs: Math.round(finite(macros.c ?? macros.carbs, 'Carbohidratos') * factor),
      fat: Math.round(finite(macros.f ?? macros.fat, 'Grasas') * factor),
      recipeId: recipe.id,
      portionScale: Number(factor.toFixed(4)),
      origin: sourceId ? 'monthly-menu' : 'recipe-library',
      ...(sourceId ? { sourceId, plannedDay: day + 1, mealIndex: slot + 1 } : {})
    };
  }

  function appendMeal(meals, entry) {
    if (!Array.isArray(meals)) fail('Diario no válido');
    if (!entry || typeof entry !== 'object') fail('Comida no válida');
    const duplicate = entry.sourceId && meals.some(meal => meal?.date === entry.date && meal?.sourceId === entry.sourceId);
    return duplicate
      ? { meals: [...meals], added: false }
      : { meals: [...meals, { ...entry }], added: true };
  }

  globalThis.FitCoachNutritionLog = { createMealEntry, appendMeal };
})();
