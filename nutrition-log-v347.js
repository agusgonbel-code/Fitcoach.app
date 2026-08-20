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

  function mealTotals(meals) {
    if (!Array.isArray(meals)) fail('Diario no válido');
    return meals.reduce((totals, meal) => ({
      kcal: totals.kcal + finite(meal?.kcal ?? 0, 'Calorías'),
      protein: totals.protein + finite(meal?.protein ?? 0, 'Proteína'),
      carbs: totals.carbs + finite(meal?.carbs ?? 0, 'Carbohidratos'),
      fat: totals.fat + finite(meal?.fat ?? 0, 'Grasas')
    }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
  }

  function updateMeal(meals, index, changes) {
    if (!Array.isArray(meals)) fail('Diario no válido');
    if (!Number.isInteger(index) || index < 0 || index >= meals.length) fail('Comida no encontrada');
    if (!changes || typeof changes !== 'object') fail('Cambios no válidos');
    const name = String(changes.name ?? '').trim().slice(0, 160);
    if (!name) fail('El nombre de la comida es obligatorio');
    const next = {
      ...meals[index],
      name,
      kcal: Math.round(finite(changes.kcal, 'Calorías')),
      protein: Math.round(finite(changes.protein, 'Proteína')),
      carbs: Math.round(finite(changes.carbs, 'Carbohidratos')),
      fat: Math.round(finite(changes.fat, 'Grasas'))
    };
    if (next.kcal > 10000 || [next.protein, next.carbs, next.fat].some(value => value > 1000)) {
      fail('Valores nutricionales fuera del rango permitido');
    }
    return meals.map((meal, mealIndex) => mealIndex === index ? next : { ...meal });
  }

  function removeMeal(meals, index) {
    if (!Array.isArray(meals)) fail('Diario no válido');
    if (!Number.isInteger(index) || index < 0 || index >= meals.length) fail('Comida no encontrada');
    return meals.filter((_, mealIndex) => mealIndex !== index).map(meal => ({ ...meal }));
  }

  globalThis.FitCoachNutritionLog = { createMealEntry, appendMeal, mealTotals, updateMeal, removeMeal };
})();
