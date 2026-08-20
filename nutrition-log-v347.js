(() => {
  'use strict';

  const fail = message => { throw new Error(message); };
  const finite = (value, label) => {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) fail(`${label} no válido`);
    return number;
  };

  let fallbackSequence = 0;
  const createMealId = () => {
    if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
    fallbackSequence += 1;
    return `meal_${Date.now().toString(36)}_${fallbackSequence.toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  };
  const validMealId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);

  function migrateMeals(meals, idFactory = createMealId) {
    if (!Array.isArray(meals)) fail('Diario no válido');
    const used = new Set();
    let changed = false;
    const migrated = meals.map(meal => {
      if (!meal || typeof meal !== 'object' || Array.isArray(meal)) fail('Comida no válida');
      let mealId = meal.mealId;
      if (!validMealId(mealId) || used.has(mealId)) {
        do mealId = idFactory(); while (!validMealId(mealId) || used.has(mealId));
        changed = true;
      }
      used.add(mealId);
      return meal.mealId === mealId ? { ...meal } : { ...meal, mealId };
    });
    return { meals: migrated, changed };
  }

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
      mealId: createMealId(),
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
    const normalized = migrateMeals(meals);
    const addedEntry = validMealId(entry.mealId) ? { ...entry } : { ...entry, mealId: createMealId() };
    return duplicate
      ? { meals: normalized.meals, added: false }
      : { meals: [...normalized.meals, addedEntry], added: true };
  }

  const editNumber = (value, label, maximum) => {
    const number = finite(value, label);
    if (number > maximum) fail(`${label} fuera del rango permitido`);
    return Math.round(number);
  };

  function updateMeal(meals, mealId, changes) {
    const normalized = migrateMeals(meals);
    if (!validMealId(mealId)) fail('Identificador de comida no válido');
    if (!changes || typeof changes !== 'object' || Array.isArray(changes)) fail('Cambios no válidos');
    const index = normalized.meals.findIndex(meal => meal.mealId === mealId);
    if (index < 0) return { meals: normalized.meals, updated: false };
    const name = String(changes.name ?? '').trim();
    if (!name || name.length > 160) fail('Nombre de comida no válido');
    const replacement = {
      ...normalized.meals[index],
      name,
      kcal: editNumber(changes.kcal, 'Calorías', 5000),
      protein: editNumber(changes.protein, 'Proteína', 1000),
      carbs: editNumber(changes.carbs, 'Carbohidratos', 1000),
      fat: editNumber(changes.fat, 'Grasas', 1000),
      editedAt: new Date().toISOString()
    };
    const next = [...normalized.meals];
    next[index] = replacement;
    return { meals: next, updated: true };
  }

  function removeMeal(meals, mealId) {
    const normalized = migrateMeals(meals);
    if (!validMealId(mealId)) fail('Identificador de comida no válido');
    const next = normalized.meals.filter(meal => meal.mealId !== mealId);
    return { meals: next, removed: next.length !== normalized.meals.length };
  }

  globalThis.FitCoachNutritionLog = { createMealEntry, appendMeal, migrateMeals, updateMeal, removeMeal };
})();
