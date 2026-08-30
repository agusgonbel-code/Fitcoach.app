import React, { useEffect, useMemo, useState } from 'react';
import type { FoodLogEntry, UserProfile } from '../../domain/models';
import { localDate, removeFoodEntry, saveFoodEntry } from '../../data/localRepository';
import { readNutritionPlan, writeNutritionPlan, type PersistedNutritionPlan } from '../../data/nutritionPlanRepository';
import {
  defaultMealTimes,
  nutritionPreferencesFingerprint,
  readNutritionPreferences,
  writeNutritionPreferences,
  type NutritionPreferences,
} from '../../data/nutritionPreferencesRepository';
import { calculateNutrition } from '../../domain/nutrition/calculateTarget';
import { CORE_INGREDIENTS, CORE_RECIPES } from '../../domain/nutrition/library';
import { findMealSwap } from '../../domain/nutrition/mealSwap';
import {
  eligibleRecipes,
  generatePersonalizedMonth,
  generatePersonalizedWeek,
  mealRelation,
  nutritionPlanQuality,
} from '../../domain/nutrition/personalizedPlanner';
import { recipeMacros, type MacroVector } from '../../domain/nutrition/recipePlanner';

interface NutritionProps {
  profile: UserProfile;
  log: FoodLogEntry[];
  onChange: () => void;
}

const recipeById = new Map(CORE_RECIPES.map((recipe) => [recipe.id, recipe]));
const ingredientById = new Map(CORE_INGREDIENTS.map((ingredient) => [ingredient.id, ingredient]));
const splitCsv = (value: string) => [...new Set(value.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean))];
const dietLabel: Record<NutritionPreferences['dietStyle'], string> = {
  omnivore: 'Omnívora', pescatarian: 'Pescetariana', vegetarian: 'Vegetariana', vegan: 'Vegana',
};

function planProfileId(profileId: string, preferences: NutritionPreferences): string {
  return `${profileId}::nutrition::${nutritionPreferencesFingerprint(preferences)}`;
}

function buildPlanState(profileId: string, target: MacroVector, preferences: NutritionPreferences): PersistedNutritionPlan {
  const id = planProfileId(profileId, preferences);
  const stored = readNutritionPlan(localStorage, id, target);
  if (stored) return stored;
  return {
    version: 1,
    profileId: id,
    target,
    week: generatePersonalizedWeek(target, preferences),
    month: generatePersonalizedMonth(target, preferences),
    overrides: {},
    horizon: 'week',
    selectedDay: 1,
    updatedAt: new Date().toISOString(),
  };
}

function targetIdentity(profileId: string, target: MacroVector, preferences: NutritionPreferences): string {
  return [planProfileId(profileId, preferences), target.kcal, target.proteinG, target.carbsG, target.fatG].join(':');
}

function relationLabel(relation: ReturnType<typeof mealRelation>): string {
  if (relation === 'pre') return 'Pre-entreno';
  if (relation === 'post') return 'Post-entreno';
  return 'Comida';
}

export function Nutrition({ profile, log, onChange }: NutritionProps) {
  const calculation = calculateNutrition(profile);
  const target = calculation.target;
  const [preferences, setPreferences] = useState<NutritionPreferences>(() => readNutritionPreferences(localStorage, profile.id));
  const [draft, setDraft] = useState<NutritionPreferences>(() => readNutritionPreferences(localStorage, profile.id));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [error, setError] = useState('');

  const today = log.filter((item) => item.localDate === localDate());
  const totals = today.reduce((sum, item) => ({
    kcal: sum.kcal + item.kcal,
    proteinG: sum.proteinG + item.proteinG,
    carbsG: sum.carbsG + item.carbsG,
    fatG: sum.fatG + item.fatG,
  }), { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 });

  const planTarget = useMemo<MacroVector>(() => ({
    kcal: target.kcal, proteinG: target.proteinG, carbsG: target.carbsG, fatG: target.fatG,
  }), [target.kcal, target.proteinG, target.carbsG, target.fatG]);
  const identity = targetIdentity(profile.id, planTarget, preferences);
  const [planState, setPlanState] = useState<PersistedNutritionPlan>(() => buildPlanState(profile.id, planTarget, preferences));

  useEffect(() => {
    if (targetIdentity(profile.id, planState.target, preferences) !== identity || planState.profileId !== planProfileId(profile.id, preferences)) {
      setPlanState(buildPlanState(profile.id, planTarget, preferences));
    }
  }, [identity, planState.profileId, planState.target, profile.id, planTarget, preferences]);

  useEffect(() => {
    if (planState.profileId !== planProfileId(profile.id, preferences)) return;
    try {
      writeNutritionPlan(localStorage, { ...planState, updatedAt: new Date().toISOString() });
    } catch (cause) {
      console.warn('FitCoach Next nutrition plan persistence', cause);
    }
  }, [planState, profile.id, preferences]);

  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const activePlan = planState.horizon === 'week' ? planState.week : planState.month;
  const safeSelectedDay = Math.min(Math.max(planState.selectedDay, 1), activePlan.length);
  const planDay = activePlan[safeSelectedDay - 1] ?? activePlan[0];

  const resolveMeal = (index: number) => {
    const planned = planDay.plan.meals[index];
    return planState.overrides[`${planState.horizon}-${safeSelectedDay}-${index}`] ?? planned;
  };

  const selectedDayMacros = planDay.plan.meals.reduce((sum, _meal, index) => {
    const meal = resolveMeal(index);
    const recipe = recipeById.get(meal.recipeId);
    if (!recipe) return sum;
    const macros = recipeMacros(recipe, CORE_INGREDIENTS, meal.scale);
    return { kcal: sum.kcal + macros.kcal, proteinG: sum.proteinG + macros.proteinG, carbsG: sum.carbsG + macros.carbsG, fatG: sum.fatG + macros.fatG };
  }, { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 });
  const quality = nutritionPlanQuality({ meals: planDay.plan.meals.map((_meal, index) => resolveMeal(index)) }, planTarget);

  const proteinPerKg = target.proteinG / profile.weightKg;
  const carbsPerKg = target.carbsG / profile.weightKg;
  const fatEnergyPct = (target.fatG * 9 / target.kcal) * 100;
  const fibreGuide = target.kcal >= 2400 ? 30 : 25;
  const proteinPerMeal = target.proteinG / preferences.mealsPerDay;

  const updateMealsPerDay = (value: number) => {
    const meals = Math.max(3, Math.min(6, Math.round(value)));
    setDraft((previous) => ({ ...previous, mealsPerDay: meals, mealTimes: defaultMealTimes(meals) }));
  };

  const updateMealTime = (index: number, value: string) => {
    setDraft((previous) => ({ ...previous, mealTimes: previous.mealTimes.map((time, i) => i === index ? value : time) }));
  };

  const saveSettings = () => {
    try {
      const saved = writeNutritionPreferences(localStorage, draft);
      eligibleRecipes(saved);
      setPreferences(saved);
      setDraft(saved);
      setPlanState(buildPlanState(profile.id, planTarget, saved));
      setSettingsOpen(false);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear un plan con estas preferencias.');
    }
  };

  const changeHorizon = (next: 'week' | 'month') => {
    setPlanState((previous) => ({ ...previous, horizon: next, selectedDay: 1 }));
    setError('');
  };

  const persist = (entry: FoodLogEntry) => {
    try {
      saveFoodEntry(entry);
      setError('');
      onChange();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar.');
    }
  };

  const addManual = () => {
    const parsed = { kcal: Number(kcal), proteinG: Number(protein || 0), carbsG: Number(carbs || 0), fatG: Number(fat || 0) };
    if (!name.trim()) return setError('Escribe el nombre de la comida.');
    if (!Number.isFinite(parsed.kcal) || parsed.kcal <= 0) return setError('Introduce unas kcal válidas.');
    if ([parsed.proteinG, parsed.carbsG, parsed.fatG].some((value) => !Number.isFinite(value) || value < 0)) return setError('Los macronutrientes deben ser números iguales o mayores que cero.');
    const kcalFromMacros = parsed.proteinG * 4 + parsed.carbsG * 4 + parsed.fatG * 9;
    if (kcalFromMacros > 0 && Math.abs(parsed.kcal - kcalFromMacros) / parsed.kcal > 0.18) {
      return setError(`Las kcal no cuadran con los macros: P/C/G equivalen aproximadamente a ${Math.round(kcalFromMacros)} kcal. Revisa la etiqueta.`);
    }
    persist({ id: crypto.randomUUID(), localDate: localDate(), name: name.trim(), ...parsed, createdAt: new Date().toISOString() });
    setName(''); setKcal(''); setProtein(''); setCarbs(''); setFat('');
  };

  const addPlannedMeal = (recipeId: string, scale: number) => {
    const recipe = recipeById.get(recipeId);
    if (!recipe) return setError('La receta planificada ya no está disponible.');
    const macros = recipeMacros(recipe, CORE_INGREDIENTS, scale);
    persist({ id: crypto.randomUUID(), localDate: localDate(), name: recipe.name, ...macros, createdAt: new Date().toISOString() });
  };

  const swapMeal = (index: number) => {
    const current = resolveMeal(index);
    try {
      const allowed = eligibleRecipes(preferences);
      const candidate = findMealSwap(current.recipeId, current.scale, allowed, CORE_INGREDIENTS, { maxKcalPct: 0.15, maxProteinG: 12 });
      if (!candidate) return setError('No hay una alternativa compatible que conserve suficientemente esta comida.');
      setPlanState((previous) => ({
        ...previous,
        overrides: { ...previous.overrides, [`${previous.horizon}-${safeSelectedDay}-${index}`]: { recipeId: candidate.recipe.id, scale: candidate.scale } },
      }));
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo sustituir esta comida.');
    }
  };

  return <section>
    <p className="eyebrow">NUTRICIÓN</p>
    <div className="hero-row"><div><h1>Plan nutricional personal</h1><p className="secondary">Una sola cadena: perfil → objetivos → comidas → recetas → registro.</p></div><button className="secondary-action" onClick={() => { setDraft(preferences); setSettingsOpen((value) => !value); }}>{settingsOpen ? 'Cerrar' : 'Configurar'}</button></div>

    {settingsOpen && <article className="form-card">
      <p className="eyebrow">PERFIL NUTRICIONAL</p><h2>Cómo comes de verdad</h2>
      <div className="form-grid">
        <label>Comidas al día<input type="number" min="3" max="6" value={draft.mealsPerDay} onChange={(event) => updateMealsPerDay(Number(event.target.value))} /></label>
        <label>Hora de entrenamiento<input type="time" value={draft.trainingTime} onChange={(event) => setDraft((p) => ({ ...p, trainingTime: event.target.value }))} /></label>
        <label>Patrón alimentario<select value={draft.dietStyle} onChange={(event) => setDraft((p) => ({ ...p, dietStyle: event.target.value as NutritionPreferences['dietStyle'] }))}><option value="omnivore">Omnívoro</option><option value="pescatarian">Pescetariano</option><option value="vegetarian">Vegetariano</option><option value="vegan">Vegano</option></select></label>
        <label>Máx. cocina por receta<input type="number" min="5" max="90" step="5" value={draft.maxPrepMinutes} onChange={(event) => setDraft((p) => ({ ...p, maxPrepMinutes: Number(event.target.value) }))} /></label>
        <label>Presupuesto<select value={draft.budget} onChange={(event) => setDraft((p) => ({ ...p, budget: event.target.value as NutritionPreferences['budget'] }))}><option value="economy">Económico</option><option value="standard">Normal</option><option value="flexible">Flexible</option></select></label>
        <label>Cómo pesas alimentos<select value={draft.weighingPreference} onChange={(event) => setDraft((p) => ({ ...p, weighingPreference: event.target.value as NutritionPreferences['weighingPreference'] }))}><option value="as-listed">Como indique cada ingrediente</option><option value="raw">Prefiero peso en crudo</option><option value="cooked">Prefiero peso cocinado</option><option value="label">Seguir etiqueta del envase</option></select></label>
      </div>
      <fieldset className="form-card"><legend>Horarios</legend><div className="form-grid">{draft.mealTimes.map((time, index) => <label key={`meal-time-${index}`}>Comida {index + 1}<input type="time" value={time} onChange={(event) => updateMealTime(index, event.target.value)} /></label>)}</div></fieldset>
      <label>Alergias o intolerancias<input value={draft.allergies.join(', ')} onChange={(event) => setDraft((p) => ({ ...p, allergies: splitCsv(event.target.value) }))} placeholder="Ej.: lactosa, huevo, soja, gluten" /></label>
      <label>Alimentos que no quieres<input value={draft.excludedFoods.join(', ')} onChange={(event) => setDraft((p) => ({ ...p, excludedFoods: splitCsv(event.target.value) }))} placeholder="Ej.: salmón, aguacate" /></label>
      <label>Alimentos que prefieres<input value={draft.preferredFoods.join(', ')} onChange={(event) => setDraft((p) => ({ ...p, preferredFoods: splitCsv(event.target.value) }))} placeholder="Ej.: pollo, arroz, yogur, legumbres" /></label>
      <button className="primary-action" onClick={saveSettings}>Guardar y regenerar el plan</button>
    </article>}

    <div className="metric-grid">
      <article className="metric-card"><strong>{Math.round(totals.kcal)} / {target.kcal}</strong><span>kcal</span></article>
      <article className="metric-card"><strong>{Math.round(totals.proteinG)} / {target.proteinG} g</strong><span>proteína</span></article>
      <article className="metric-card"><strong>{Math.round(totals.carbsG)} / {target.carbsG} g</strong><span>carbohidratos</span></article>
      <article className="metric-card"><strong>{Math.round(totals.fatG)} / {target.fatG} g</strong><span>grasas</span></article>
    </div>

    <article className="form-card">
      <div className="hero-row"><div><p className="eyebrow">TU BASE</p><h2>{dietLabel[preferences.dietStyle]} · {preferences.mealsPerDay} comidas</h2></div><strong>{calculation.tdee} kcal TDEE</strong></div>
      <div className="metric-grid">
        <article className="metric-card"><strong>{proteinPerKg.toFixed(1)} g/kg</strong><span>proteína</span></article>
        <article className="metric-card"><strong>{carbsPerKg.toFixed(1)} g/kg</strong><span>carbohidratos</span></article>
        <article className="metric-card"><strong>{Math.round(fatEnergyPct)}%</strong><span>energía de grasas</span></article>
        <article className="metric-card"><strong>≥ {fibreGuide} g</strong><span>fibra orientativa</span></article>
      </div>
      <p className="secondary">Mifflin-St Jeor para estimar gasto, con ajuste conservador por objetivo. La proteína se reparte alrededor de {Math.round(proteinPerMeal)} g por comida como referencia, sin exigir que todas las tomas sean idénticas. Grasas y carbohidratos completan la energía manteniendo combustible para entrenar.</p>
      <p className="secondary">Referencias del motor: rangos de proteína deportiva de consenso, grasas dentro de 20–35% de energía como marco poblacional y ≥25 g/día de fibra en adultos. Son puntos de partida para personas sanas; la evolución real manda sobre la estimación.</p>
    </article>

    <article className="form-card">
      <div className="hero-row"><div><p className="eyebrow">PLAN DE COMIDAS</p><h2>Día {safeSelectedDay}</h2></div><strong>{Math.round(selectedDayMacros.kcal)} kcal</strong></div>
      <div className="segmented-control" aria-label="Duración del plan"><button className={planState.horizon === 'week' ? 'active' : ''} onClick={() => changeHorizon('week')}>7 días</button><button className={planState.horizon === 'month' ? 'active' : ''} onClick={() => changeHorizon('month')}>30 días</button></div>
      <div className="day-selector" aria-label="Seleccionar día del plan">{activePlan.map((day) => <button key={day.day} className={day.day === safeSelectedDay ? 'active' : ''} onClick={() => setPlanState((previous) => ({ ...previous, selectedDay: day.day }))}>{day.day}</button>)}</div>
      <p className="secondary">Plan: {Math.round(selectedDayMacros.proteinG)}P · {Math.round(selectedDayMacros.carbsG)}C · {Math.round(selectedDayMacros.fatG)}G. Diferencia frente al objetivo: {Math.round((quality.actual.kcal - target.kcal))} kcal, {Math.round(quality.actual.proteinG - target.proteinG)} g proteína, {Math.round(quality.actual.carbsG - target.carbsG)} g CH, {Math.round(quality.actual.fatG - target.fatG)} g grasa.</p>
      {planDay.plan.meals.map((_meal, index) => {
        const meal = resolveMeal(index);
        const recipe = recipeById.get(meal.recipeId);
        if (!recipe) return null;
        const macros = recipeMacros(recipe, CORE_INGREDIENTS, meal.scale);
        const time = preferences.mealTimes[index] ?? '--:--';
        const relation = mealRelation(time, preferences.trainingTime);
        return <article className="planned-meal" key={`${planState.horizon}-${safeSelectedDay}-${index}`}>
          <div className="planned-meal-heading"><div><strong>{time} · {relationLabel(relation)} · {recipe.name}</strong><p className="secondary">{Math.round(macros.kcal)} kcal · {Math.round(macros.proteinG)}P · {Math.round(macros.carbsG)}C · {Math.round(macros.fatG)}G</p></div></div>
          <details className="recipe-detail"><summary>Ver receta y gramos</summary><p className="secondary">{recipe.prepMinutes ?? '—'} min · cantidades calculadas desde composición por 100 g. El estado crudo/cocido aparece en cada ingrediente.</p><div className="ingredient-list">{recipe.ingredients.map((item) => <div className="ingredient-row" key={item.ingredientId}><span>{ingredientById.get(item.ingredientId)?.name ?? item.ingredientId}</span><strong>{Math.round(item.grams * meal.scale)} g</strong></div>)}</div>{!!recipe.steps?.length && <ol className="recipe-steps">{recipe.steps.map((step, stepIndex) => <li key={`${recipe.id}-step-${stepIndex}`}>{step}</li>)}</ol>}</details>
          <div className="meal-actions"><button className="secondary-action" onClick={() => swapMeal(index)}>Sustituir equivalente</button><button className="secondary-action" onClick={() => addPlannedMeal(meal.recipeId, meal.scale)}>Registrar hoy</button></div>
        </article>;
      })}
      {error && <p className="error" role="alert">{error}</p>}
    </article>

    <article className="form-card"><h2>Añadir comida desde etiqueta</h2><p className="secondary">Introduce exactamente los datos del envase. FitCoach comprueba que las kcal sean compatibles con los macros para detectar errores de transcripción.</p><label>Nombre<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. arroz de tu marca" /></label><div className="form-grid"><label>Kcal<input inputMode="numeric" value={kcal} onChange={(event) => setKcal(event.target.value)} /></label><label>Proteína g<input inputMode="decimal" value={protein} onChange={(event) => setProtein(event.target.value)} /></label><label>Carbohidratos g<input inputMode="decimal" value={carbs} onChange={(event) => setCarbs(event.target.value)} /></label><label>Grasas g<input inputMode="decimal" value={fat} onChange={(event) => setFat(event.target.value)} /></label></div><button className="primary-action" onClick={addManual}>Guardar comida</button></article>

    {today.map((item) => <article className="exercise-card" key={item.id}><div className="hero-row"><div><h2>{item.name}</h2><p className="secondary">{Math.round(item.kcal)} kcal · {Math.round(item.proteinG)}P · {Math.round(item.carbsG)}C · {Math.round(item.fatG)}G</p></div><button className="icon-button" aria-label={`Eliminar ${item.name}`} onClick={() => { removeFoodEntry(item.id); onChange(); }}>×</button></div></article>)}
  </section>;
}
