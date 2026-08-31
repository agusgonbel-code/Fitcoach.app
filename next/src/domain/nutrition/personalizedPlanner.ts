import type { NutritionPreferences } from '../../data/nutritionPreferencesRepository';
import { CORE_INGREDIENTS, CORE_RECIPES } from './library';
import { dayMacros, optimizeDay, type MacroVector, type PlannedNutritionDay, type RecipeDefinition } from './recipePlanner';
import type { WeeklyNutritionDay } from './weeklyPlanner';
import type { MonthlyNutritionDay } from './monthlyPlanner';

const animal = {
  meat: new Set(['chicken', 'turkey']),
  fish: new Set(['salmon', 'tuna']),
  dairyEgg: new Set(['egg', 'eggwhite', 'skyr', 'greek0', 'cottage', 'whey']),
};

const ALLERGY_ALIASES: Record<string, string[]> = {
  lactosa: ['skyr', 'greek0', 'cottage', 'whey'],
  leche: ['skyr', 'greek0', 'cottage', 'whey'],
  'lácteos': ['skyr', 'greek0', 'cottage', 'whey'],
  huevo: ['egg', 'eggwhite'],
  pescado: ['salmon', 'tuna'],
  'frutos secos': ['almonds', 'peanutbutter'],
  cacahuete: ['peanutbutter'],
  soja: ['soy-yogurt', 'tofu', 'tempeh'],
  gluten: ['bread', 'wrap', 'pasta'],
};

const BREAKFAST_IDS = ['oat-cake', 'skyr-bowl', 'greek-fruit', 'cottage-toast', 'vegan-oat-bowl'];
const SNACK_IDS = ['skyr-banana', 'greek-fruit', 'whey-banana', 'plant-shake', 'cottage-toast', 'vegan-oat-bowl'];
const MAIN_IDS = ['chicken-rice', 'chicken-potato', 'turkey-pasta', 'salmon-potato', 'lentil-chicken', 'chickpea-tuna', 'tuna-toast', 'turkey-wrap', 'tofu-rice', 'tempeh-potato', 'lentil-tofu', 'bean-tempeh-bowl'];

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function dietForbidden(preferences: NutritionPreferences): Set<string> {
  const forbidden = new Set<string>();
  if (preferences.dietStyle === 'pescatarian' || preferences.dietStyle === 'vegetarian' || preferences.dietStyle === 'vegan') animal.meat.forEach((id) => forbidden.add(id));
  if (preferences.dietStyle === 'vegetarian' || preferences.dietStyle === 'vegan') animal.fish.forEach((id) => forbidden.add(id));
  if (preferences.dietStyle === 'vegan') animal.dairyEgg.forEach((id) => forbidden.add(id));
  return forbidden;
}

function userForbidden(preferences: NutritionPreferences): Set<string> {
  const forbidden = dietForbidden(preferences);
  const ingredientById = new Map(CORE_INGREDIENTS.map((item) => [item.id, item]));
  const tokens = [...(preferences.allergies ?? []), ...(preferences.excludedFoods ?? [])].map(normalize).filter(Boolean);
  for (const token of tokens) {
    const alias = Object.entries(ALLERGY_ALIASES).find(([key]) => normalize(key) === token)?.[1] ?? [];
    alias.forEach((id) => forbidden.add(id));
    for (const ingredient of CORE_INGREDIENTS) {
      const haystack = normalize(`${ingredient.id} ${ingredient.name}`);
      if (haystack.includes(token) || token.includes(normalize(ingredient.name))) forbidden.add(ingredient.id);
    }
  }
  return new Set([...forbidden].filter((id) => ingredientById.has(id)));
}

export function eligibleRecipes(preferences: NutritionPreferences): RecipeDefinition[] {
  const forbidden = userForbidden(preferences);
  const prepLimit = Math.max(5, Number(preferences.maxPrepMinutes) || 30);
  const allowed = CORE_RECIPES.filter((recipe) => (recipe.prepMinutes ?? 0) <= prepLimit && recipe.ingredients.every((item) => !forbidden.has(item.ingredientId)));
  if (!allowed.length) throw new Error('Tus restricciones dejan el recetario sin opciones. Amplía el tiempo de preparación o revisa exclusiones/alergias.');
  return allowed;
}

function recipePreferenceScore(recipe: RecipeDefinition, preferences: NutritionPreferences): number {
  const preferred = (preferences.preferredFoods ?? []).map(normalize).filter(Boolean);
  const names = recipe.ingredients.map((item) => CORE_INGREDIENTS.find((ingredient) => ingredient.id === item.ingredientId)?.name ?? item.ingredientId).join(' ');
  const haystack = normalize(`${recipe.name} ${names}`);
  let score = preferred.reduce((sum, token) => sum + (haystack.includes(token) ? 3 : 0), 0);
  if (preferences.budget === 'economy') {
    if (recipe.ingredients.some((item) => ['salmon', 'avocado', 'almonds'].includes(item.ingredientId))) score -= 2;
    if (recipe.ingredients.some((item) => ['lentils', 'chickpeas', 'beans', 'egg', 'chicken', 'oats'].includes(item.ingredientId))) score += 1;
  }
  return score;
}

function chooseFromPool(poolIds: string[], eligible: RecipeDefinition[], preferences: NutritionPreferences, seed: number, used: Set<string>): RecipeDefinition {
  const candidates = eligible.filter((recipe) => poolIds.includes(recipe.id));
  const source = candidates.length ? candidates : eligible;
  const ranked = [...source].sort((a, b) => {
    const score = recipePreferenceScore(b, preferences) - recipePreferenceScore(a, preferences);
    return score !== 0 ? score : a.id.localeCompare(b.id);
  });
  const unused = ranked.filter((recipe) => !used.has(recipe.id));
  const selectable = unused.length ? unused : ranked;
  return selectable[seed % selectable.length];
}

function minutes(time: string): number {
  const [h, m] = (time || '12:00').split(':').map(Number);
  return h * 60 + m;
}

export function mealRelation(time: string, trainingTime: string): 'pre' | 'post' | 'normal' {
  const meal = minutes(time);
  const training = minutes(trainingTime);
  const before = (training - meal + 1440) % 1440;
  const after = (meal - training + 1440) % 1440;
  if (before > 0 && before <= 180) return 'pre';
  if (after >= 0 && after <= 180) return 'post';
  return 'normal';
}

function slotPool(index: number, meals: number, relation: 'pre' | 'post' | 'normal'): string[] {
  if (index === 0) return BREAKFAST_IDS;
  if (relation === 'pre' || relation === 'post') return SNACK_IDS;
  if (index === meals - 1 || index === Math.floor(meals / 2)) return MAIN_IDS;
  return index % 2 === 0 ? MAIN_IDS : SNACK_IDS;
}

function buildInitialDay(preferences: NutritionPreferences, dayIndex: number): PlannedNutritionDay {
  const eligible = eligibleRecipes(preferences);
  const used = new Set<string>();
  const mealsPerDay = Math.max(3, Math.min(6, Number(preferences.mealsPerDay) || 4));
  return {
    meals: Array.from({ length: mealsPerDay }, (_, index) => {
      const time = preferences.mealTimes?.[index] ?? '12:00';
      const relation = mealRelation(time, preferences.trainingTime || '18:00');
      const recipe = chooseFromPool(slotPool(index, mealsPerDay, relation), eligible, preferences, dayIndex * 11 + index * 3, used);
      used.add(recipe.id);
      return { recipeId: recipe.id, scale: 1 };
    }),
  };
}

function optimizePersonalizedDay(target: MacroVector, preferences: NutritionPreferences, dayIndex: number): PlannedNutritionDay {
  const initial = buildInitialDay(preferences, dayIndex);
  return optimizeDay(initial, CORE_RECIPES, CORE_INGREDIENTS, target, { minScale: 0.5, maxScale: 1.8, iterations: 320 });
}

export function generatePersonalizedWeek(target: MacroVector, preferences: NutritionPreferences): WeeklyNutritionDay[] {
  return Array.from({ length: 7 }, (_, index) => {
    const plan = optimizePersonalizedDay(target, preferences, index);
    return { day: index + 1, plan, macros: dayMacros(plan, CORE_RECIPES, CORE_INGREDIENTS) };
  });
}

export function generatePersonalizedMonth(target: MacroVector, preferences: NutritionPreferences, days = 30): MonthlyNutritionDay[] {
  if (!Number.isInteger(days) || days < 1 || days > 31) throw new Error('Nutrition plan length must be between 1 and 31 days.');
  return Array.from({ length: days }, (_, index) => {
    const plan = optimizePersonalizedDay(target, preferences, index);
    return { day: index + 1, week: Math.floor(index / 7) + 1, plan, macros: dayMacros(plan, CORE_RECIPES, CORE_INGREDIENTS) };
  });
}

export function nutritionPlanQuality(day: PlannedNutritionDay, target: MacroVector): { actual: MacroVector; kcalPct: number; proteinDeltaG: number; carbsDeltaG: number; fatDeltaG: number } {
  const actual = dayMacros(day, CORE_RECIPES, CORE_INGREDIENTS);
  return {
    actual,
    kcalPct: Math.abs(actual.kcal - target.kcal) / Math.max(1, target.kcal),
    proteinDeltaG: Math.abs(actual.proteinG - target.proteinG),
    carbsDeltaG: Math.abs(actual.carbsG - target.carbsG),
    fatDeltaG: Math.abs(actual.fatG - target.fatG),
  };
}
