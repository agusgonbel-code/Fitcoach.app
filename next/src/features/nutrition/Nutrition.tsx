import React, { useMemo, useState } from 'react';
import type { FoodLogEntry, UserProfile } from '../../domain/models';
import { localDate, removeFoodEntry, saveFoodEntry } from '../../data/localRepository';
import { calculateNutrition } from '../../domain/nutrition/calculateTarget';
import { CORE_INGREDIENTS, CORE_RECIPES } from '../../domain/nutrition/library';
import { recipeMacros } from '../../domain/nutrition/recipePlanner';
import { generateWeek } from '../../domain/nutrition/weeklyPlanner';

interface NutritionProps {
  profile: UserProfile;
  log: FoodLogEntry[];
  onChange: () => void;
}

const recipeById = new Map(CORE_RECIPES.map((recipe) => [recipe.id, recipe]));

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

  const weeklyPlan = useMemo(() => generateWeek({
    kcal: target.kcal,
    proteinG: target.proteinG,
    carbsG: target.carbsG,
    fatG: target.fatG,
  }), [target.kcal, target.proteinG, target.carbsG, target.fatG]);

  const [selectedDay, setSelectedDay] = useState(1);
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [error, setError] = useState('');
  const planDay = weeklyPlan[selectedDay - 1];

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
    persist({
      id: crypto.randomUUID(),
      localDate: localDate(),
      name: name.trim(),
      kcal: Number(kcal),
      proteinG: Number(protein || 0),
      carbsG: Number(carbs || 0),
      fatG: Number(fat || 0),
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

  return <section>
    <p className="eyebrow">NUTRICIÓN</p>
    <h1>Tu estrategia</h1>
    <div className="metric-grid">
      <article className="metric-card"><strong>{Math.round(totals.kcal)} / {target.kcal}</strong><span>kcal</span></article>
      <article className="metric-card"><strong>{Math.round(totals.proteinG)} / {target.proteinG} g</strong><span>proteína</span></article>
      <article className="metric-card"><strong>{Math.round(totals.carbsG)} / {target.carbsG} g</strong><span>carbohidratos</span></article>
      <article className="metric-card"><strong>{Math.round(totals.fatG)} / {target.fatG} g</strong><span>grasas</span></article>
    </div>
    <p className="secondary">Objetivo calculado con Mifflin-St Jeor · TDEE estimado {calculation.tdee} kcal · ajuste {Math.round(calculation.adjustmentPct * 100)}%.</p>

    <article className="form-card">
      <div className="hero-row"><div><p className="eyebrow">PLAN SEMANAL</p><h2>Día {selectedDay}</h2></div><strong>{Math.round(planDay.macros.kcal)} kcal</strong></div>
      <div className="day-selector" aria-label="Seleccionar día del plan">
        {weeklyPlan.map((day) => <button key={day.day} className={day.day === selectedDay ? 'active' : ''} onClick={() => setSelectedDay(day.day)}>{day.day}</button>)}
      </div>
      <p className="secondary">{Math.round(planDay.macros.proteinG)}P · {Math.round(planDay.macros.carbsG)}C · {Math.round(planDay.macros.fatG)}G. Las cantidades se optimizan desde los gramos reales de cada ingrediente.</p>
      {planDay.plan.meals.map((meal, index) => {
        const recipe = recipeById.get(meal.recipeId);
        if (!recipe) return null;
        const macros = recipeMacros(recipe, CORE_INGREDIENTS, meal.scale);
        return <div className="planned-meal" key={`${selectedDay}-${meal.recipeId}-${index}`}>
          <div><strong>{index + 1}. {recipe.name}</strong><p className="secondary">{Math.round(meal.scale * 100)}% ración · {Math.round(macros.kcal)} kcal · {Math.round(macros.proteinG)}P · {Math.round(macros.carbsG)}C · {Math.round(macros.fatG)}G</p></div>
          <button className="secondary-action" onClick={() => addPlannedMeal(meal.recipeId, meal.scale)}>Registrar hoy</button>
        </div>;
      })}
    </article>

    <div className="form-card"><h2>Añadir comida manual</h2><label>Nombre<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. yogur con avena" /></label><div className="form-grid"><label>Kcal<input inputMode="numeric" value={kcal} onChange={(event) => setKcal(event.target.value)} /></label><label>Proteína g<input inputMode="decimal" value={protein} onChange={(event) => setProtein(event.target.value)} /></label><label>Carbos g<input inputMode="decimal" value={carbs} onChange={(event) => setCarbs(event.target.value)} /></label><label>Grasas g<input inputMode="decimal" value={fat} onChange={(event) => setFat(event.target.value)} /></label></div>{error && <p className="error" role="alert">{error}</p>}<button className="primary-action" onClick={addManual}>Guardar comida</button></div>

    {today.map((item) => <article className="exercise-card" key={item.id}><div className="hero-row"><div><h2>{item.name}</h2><p className="secondary">{Math.round(item.kcal)} kcal · {Math.round(item.proteinG)}P · {Math.round(item.carbsG)}C · {Math.round(item.fatG)}G</p></div><button className="icon-button" aria-label={`Eliminar ${item.name}`} onClick={() => { removeFoodEntry(item.id); onChange(); }}>×</button></div></article>)}
  </section>;
}
