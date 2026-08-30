import React, { useEffect, useMemo, useState } from 'react';
import type { FoodLogEntry, UserProfile } from '../../domain/models';
import { localDate, removeFoodEntry, saveFoodEntry } from '../../data/localRepository';
import {
  readNutritionPlan,
  writeNutritionPlan,
  type PersistedNutritionPlan,
} from '../../data/nutritionPlanRepository';
import { calculateNutrition } from '../../domain/nutrition/calculateTarget';
import { CORE_INGREDIENTS, CORE_RECIPES } from '../../domain/nutrition/library';
import { findMealSwap } from '../../domain/nutrition/mealSwap';
import { generateMonth } from '../../domain/nutrition/monthlyPlanner';
import { recipeMacros, type MacroVector } from '../../domain/nutrition/recipePlanner';
import { generateWeek } from '../../domain/nutrition/weeklyPlanner';

interface NutritionProps {
  profile: UserProfile;
  log: FoodLogEntry[];
  onChange: () => void;
}

const recipeById = new Map(CORE_RECIPES.map((recipe) => [recipe.id, recipe]));
const ingredientById = new Map(CORE_INGREDIENTS.map((ingredient) => [ingredient.id, ingredient]));

function buildPlanState(profileId: string, target: MacroVector): PersistedNutritionPlan {
  const stored = readNutritionPlan(localStorage, profileId, target);
  if (stored) return stored;
  return {
    version: 1,
    profileId,
    target,
    week: generateWeek(target),
    month: generateMonth(target),
    overrides: {},
    horizon: 'week',
    selectedDay: 1,
    updatedAt: new Date().toISOString(),
  };
}

function targetIdentity(profileId: string, target: MacroVector): string {
  return [profileId, target.kcal, target.proteinG, target.carbsG, target.fatG].join(':');
}

export function Nutrition({ profile, log, onChange }: NutritionProps) {
  const calculation = calculateNutrition(profile);
  const target = calculation.target;
  const today = log.filter((item) => item.localDate === localDate());
  const totals = today.reduce((sum, item) => ({
    kcal: sum.kcal + item.kcal,
    proteinG: sum.proteinG + item.proteinG,
    carbsG: sum.carbsG + item.carbsG,
    fatG: sum.fatG + item.fatG,
  }), { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 });

  const planTarget = useMemo<MacroVector>(() => ({
    kcal: target.kcal,
    proteinG: target.proteinG,
    carbsG: target.carbsG,
    fatG: target.fatG,
  }), [target.kcal, target.proteinG, target.carbsG, target.fatG]);
  const identity = targetIdentity(profile.id, planTarget);
  const [planState, setPlanState] = useState<PersistedNutritionPlan>(() => buildPlanState(profile.id, planTarget));

  useEffect(() => {
    if (targetIdentity(planState.profileId, planState.target) !== identity) {
      setPlanState(buildPlanState(profile.id, planTarget));
    }
  }, [identity, planState.profileId, planState.target, profile.id, planTarget]);

  useEffect(() => {
    if (targetIdentity(planState.profileId, planState.target) !== identity) return;
    try {
      writeNutritionPlan(localStorage, { ...planState, updatedAt: new Date().toISOString() });
    } catch (cause) {
      console.warn('FitCoach Next nutrition plan persistence', cause);
    }
  }, [identity, planState]);

  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [error, setError] = useState('');
  const activePlan = planState.horizon === 'week' ? planState.week : planState.month;
  const safeSelectedDay = Math.min(Math.max(planState.selectedDay, 1), activePlan.length);
  const planDay = activePlan[safeSelectedDay - 1] ?? activePlan[0];

  const proteinPerKg = target.proteinG / profile.weightKg;
  const carbsPerKg = target.carbsG / profile.weightKg;
  const fatEnergyPct = (target.fatG * 9 / target.kcal) * 100;
  const proteinPerMealGuide = Math.max(20, profile.weightKg * 0.25);
  const fibreGuide = target.kcal >= 2400 ? 30 : 25;

  const changeHorizon = (next: 'week' | 'month') => {
    setPlanState((previous) => ({ ...previous, horizon: next, selectedDay: 1 }));
    setError('');
  };

  const resolveMeal = (index: number) => {
    const planned = planDay.plan.meals[index];
    return planState.overrides[`${planState.horizon}-${safeSelectedDay}-${index}`] ?? planned;
  };

  const selectedDayMacros = planDay.plan.meals.reduce((sum, _meal, index) => {
    const resolved = resolveMeal(index);
    const recipe = recipeById.get(resolved.recipeId);
    if (!recipe) return sum;
    const macros = recipeMacros(recipe, CORE_INGREDIENTS, resolved.scale);
    return {
      kcal: sum.kcal + macros.kcal,
      proteinG: sum.proteinG + macros.proteinG,
      carbsG: sum.carbsG + macros.carbsG,
      fatG: sum.fatG + macros.fatG,
    };
  }, { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 });

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
    const parsed = {
      kcal: Number(kcal),
      proteinG: Number(protein || 0),
      carbsG: Number(carbs || 0),
      fatG: Number(fat || 0),
    };
    if (!name.trim()) return setError('Escribe el nombre de la comida.');
    if (!Number.isFinite(parsed.kcal) || parsed.kcal <= 0) return setError('Introduce unas kcal válidas.');
    if ([parsed.proteinG, parsed.carbsG, parsed.fatG].some((value) => !Number.isFinite(value) || value < 0)) {
      return setError('Los macronutrientes deben ser números iguales o mayores que cero.');
    }
    persist({
      id: crypto.randomUUID(),
      localDate: localDate(),
      name: name.trim(),
      ...parsed,
      createdAt: new Date().toISOString(),
    });
    setName(''); setKcal(''); setProtein(''); setCarbs(''); setFat('');
  };

  const addPlannedMeal = (recipeId: string, scale: number) => {
    const recipe = recipeById.get(recipeId);
    if (!recipe) return setError('La receta planificada ya no está disponible.');
    const macros = recipeMacros(recipe, CORE_INGREDIENTS, scale);
    persist({
      id: crypto.randomUUID(),
      localDate: localDate(),
      name: recipe.name,
      kcal: macros.kcal,
      proteinG: macros.proteinG,
      carbsG: macros.carbsG,
      fatG: macros.fatG,
      createdAt: new Date().toISOString(),
    });
  };

  const swapMeal = (index: number) => {
    const current = resolveMeal(index);
    try {
      const candidate = findMealSwap(current.recipeId, current.scale, CORE_RECIPES, CORE_INGREDIENTS);
      if (!candidate) {
        setError('No hay una alternativa que conserve los macros dentro de tolerancia.');
        return;
      }
      setPlanState((previous) => ({
        ...previous,
        overrides: {
          ...previous.overrides,
          [`${previous.horizon}-${safeSelectedDay}-${index}`]: { recipeId: candidate.recipe.id, scale: candidate.scale },
        },
      }));
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo sustituir esta comida.');
    }
  };

  return <section>
    <p className="eyebrow">NUTRICIÓN</p>
    <h1>Tu estrategia nutricional</h1>
    <div className="metric-grid">
      <article className="metric-card"><strong>{Math.round(totals.kcal)} / {target.kcal}</strong><span>kcal</span></article>
      <article className="metric-card"><strong>{Math.round(totals.proteinG)} / {target.proteinG} g</strong><span>proteína</span></article>
      <article className="metric-card"><strong>{Math.round(totals.carbsG)} / {target.carbsG} g</strong><span>carbohidratos</span></article>
      <article className="metric-card"><strong>{Math.round(totals.fatG)} / {target.fatG} g</strong><span>grasas</span></article>
    </div>
    <p className="secondary">Mifflin-St Jeor · TDEE estimado {calculation.tdee} kcal · ajuste inicial {Math.round(calculation.adjustmentPct * 100)}%. Son objetivos de partida y deben reajustarse con la evolución real de peso, rendimiento, recuperación y adherencia.</p>

    <article className="form-card">
      <p className="eyebrow">POR QUÉ ESTOS MACROS</p>
      <h2>Base basada en evidencia</h2>
      <div className="metric-grid">
        <article className="metric-card"><strong>{proteinPerKg.toFixed(1)} g/kg</strong><span>proteína diaria</span></article>
        <article className="metric-card"><strong>{carbsPerKg.toFixed(1)} g/kg</strong><span>carbohidratos</span></article>
        <article className="metric-card"><strong>{Math.round(fatEnergyPct)}%</strong><span>energía de grasas</span></article>
        <article className="metric-card"><strong>≥ {fibreGuide} g</strong><span>fibra/día</span></article>
      </div>
      <p className="secondary">Proteína orientada a preservar o ganar masa muscular; carbohidratos para sostener el entrenamiento; grasas dentro de un rango suficiente; y al menos {fibreGuide} g de fibra como referencia práctica. Intenta repartir la proteína en 4–5 tomas de aproximadamente {Math.round(proteinPerMealGuide)}–{Math.round(proteinPerMealGuide + 10)} g y prioriza fruta, verdura, legumbres, cereales integrales, frutos secos/semillas y aceite de oliva.</p>
      <p className="secondary">Los valores de alimentos son referencias genéricas por 100 g y especifican si el peso es cocido o seco. En productos envasados, usa siempre la etiqueta del fabricante si difiere.</p>
    </article>

    <article className="form-card">
      <div className="hero-row"><div><p className="eyebrow">PLAN DE COMIDAS</p><h2>Día {safeSelectedDay}</h2></div><strong>{Math.round(selectedDayMacros.kcal)} kcal</strong></div>
      <div className="segmented-control" aria-label="Duración del plan">
        <button className={planState.horizon === 'week' ? 'active' : ''} onClick={() => changeHorizon('week')}>7 días</button>
        <button className={planState.horizon === 'month' ? 'active' : ''} onClick={() => changeHorizon('month')}>30 días</button>
      </div>
      <div className="day-selector" aria-label="Seleccionar día del plan">
        {activePlan.map((day) => <button key={day.day} className={day.day === safeSelectedDay ? 'active' : ''} onClick={() => setPlanState((previous) => ({ ...previous, selectedDay: day.day }))}>{day.day}</button>)}
      </div>
      <p className="secondary">{Math.round(selectedDayMacros.proteinG)}P · {Math.round(selectedDayMacros.carbsG)}C · {Math.round(selectedDayMacros.fatG)}G. El plan y tus sustituciones quedan guardados en este dispositivo y se recalculan sólo si cambia tu objetivo.</p>
      {planDay.plan.meals.map((_meal, index) => {
        const meal = resolveMeal(index);
        const recipe = recipeById.get(meal.recipeId);
        if (!recipe) return null;
        const macros = recipeMacros(recipe, CORE_INGREDIENTS, meal.scale);
        return <article className="planned-meal" key={`${planState.horizon}-${safeSelectedDay}-${index}`}>
          <div className="planned-meal-heading">
            <div><strong>{index + 1}. {recipe.name}</strong><p className="secondary">{Math.round(meal.scale * 100)}% ración · {Math.round(macros.kcal)} kcal · {Math.round(macros.proteinG)}P · {Math.round(macros.carbsG)}C · {Math.round(macros.fatG)}G</p></div>
          </div>
          <details className="recipe-detail">
            <summary>Receta completa</summary>
            <p className="secondary">{recipe.prepMinutes ?? '—'} min · {recipe.servings ?? 1} ración base · cantidades ajustadas a tu objetivo</p>
            <div className="ingredient-list">
              {recipe.ingredients.map((item) => <div className="ingredient-row" key={item.ingredientId}>
                <span>{ingredientById.get(item.ingredientId)?.name ?? item.ingredientId}</span>
                <strong>{Math.round(item.grams * meal.scale)} g</strong>
              </div>)}
            </div>
            {!!recipe.steps?.length && <ol className="recipe-steps">
              {recipe.steps.map((step, stepIndex) => <li key={`${recipe.id}-step-${stepIndex}`}>{step}</li>)}
            </ol>}
          </details>
          <div className="meal-actions">
            <button className="secondary-action" onClick={() => swapMeal(index)}>Sustituir</button>
            <button className="secondary-action" onClick={() => addPlannedMeal(meal.recipeId, meal.scale)}>Registrar hoy</button>
          </div>
        </article>;
      })}
      {error && <p className="error" role="alert">{error}</p>}
    </article>

    <div className="form-card"><h2>Añadir comida manual</h2><label>Nombre<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. yogur con avena" /></label><div className="form-grid"><label>Kcal<input inputMode="numeric" value={kcal} onChange={(event) => setKcal(event.target.value)} /></label><label>Proteína g<input inputMode="decimal" value={protein} onChange={(event) => setProtein(event.target.value)} /></label><label>Carbos g<input inputMode="decimal" value={carbs} onChange={(event) => setCarbs(event.target.value)} /></label><label>Grasas g<input inputMode="decimal" value={fat} onChange={(event) => setFat(event.target.value)} /></label></div><button className="primary-action" onClick={addManual}>Guardar comida</button></div>

    {today.map((item) => <article className="exercise-card" key={item.id}><div className="hero-row"><div><h2>{item.name}</h2><p className="secondary">{Math.round(item.kcal)} kcal · {Math.round(item.proteinG)}P · {Math.round(item.carbsG)}C · {Math.round(item.fatG)}G</p></div><button className="icon-button" aria-label={`Eliminar ${item.name}`} onClick={() => { removeFoodEntry(item.id); onChange(); }}>×</button></div></article>)}
  </section>;
}
